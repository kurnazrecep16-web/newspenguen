// Sağlayıcı adaptörleri. Her adaptör: sorgu kurar → HTTP çağırır → yanıtı RawArticle[]'a çevirir.
// parse* fonksiyonları saftır ve testlerde gerçek yanıt biçimindeki fixture'larla sınanır.
import type { RawArticle } from "../types.ts";
import type { QuerySpec } from "../queries.ts";
import { gdeltQuery, newsApiQuery, theNewsApiQuery } from "../queries.ts";
import { fetchWithRetry, ProviderError, RateLimitError, type RetryOptions } from "../http.ts";
import { decodeEntities, stripHtml } from "../text.ts";

export type Window = { from: Date; to: Date };
export type ProviderContext = { env: (k: string) => string | undefined; retry?: RetryOptions; config?: Record<string, unknown> };

export interface SearchProvider {
  key: string;
  /** null: bu dil desteklenmiyor, sorgu atlanır */
  langParam(lang: string): string | null;
  search(spec: QuerySpec, w: Window, ctx: ProviderContext): Promise<RawArticle[]>;
}

// ------------------------------------------------------------------ GDELT DOC 2.0
const GDELT_LANG: Record<string, string> = {
  en: "english", tr: "turkish", de: "german", fr: "french", it: "italian", es: "spanish", nl: "dutch", pt: "portuguese", pl: "polish", zh: "chinese",
};
const GDELT_ISO: Record<string, string> = Object.fromEntries(Object.entries(GDELT_LANG).map(([k, v]) => [v, k]));

const gdeltTime = (d: Date) => d.toISOString().replace(/[-:T]/g, "").slice(0, 14);

/** "20261127T153000Z" → ISO */
export function gdeltSeenDate(s: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/.exec(s ?? "");
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}

export function parseGdelt(body: string, query: string): RawArticle[] {
  const t = body.trim();
  if (!t) return [];
  if (!t.startsWith("{")) {
    if (/limit requests|one every/i.test(t)) throw new RateLimitError(`GDELT: ${t.slice(0, 120)}`, 60_000);
    throw new ProviderError(`GDELT: ${t.slice(0, 160)}`, 200);
  }
  const j = JSON.parse(t) as { articles?: Record<string, string>[] };
  return (j.articles ?? []).filter((a) => a.url && a.title).map((a) => ({
    provider: "gdelt",
    external_id: null,
    url: a.url,
    title: decodeEntities(a.title).trim(),
    description: null,                         // GDELT ArtList açıklama vermez
    storage_right: "link_only" as const,
    publisher: a.domain ?? null,
    language: GDELT_ISO[(a.language ?? "").toLowerCase()] ?? null,
    source_country: a.sourcecountry || null,
    published_at: gdeltSeenDate(a.seendate),   // GDELT'in gördüğü an (yayın anına yakın)
    query,
  }));
}

export const gdelt: SearchProvider = {
  key: "gdelt",
  langParam: (l) => GDELT_LANG[l] ?? null,
  async search(spec, w, ctx) {
    const query = gdeltQuery(spec, GDELT_LANG[spec.lang]);
    const max = Number(ctx.config?.maxrecords ?? 250);
    const url = "https://api.gdeltproject.org/api/v2/doc/doc?" + new URLSearchParams({
      query, mode: "ArtList", format: "json", maxrecords: String(Math.min(250, max)), sort: "DateDesc",
      startdatetime: gdeltTime(w.from), enddatetime: gdeltTime(w.to),
    });
    const r = await fetchWithRetry(url, { headers: { "User-Agent": "COATNEWS-BrandIntelligence/1.0" } }, ctx.retry);
    return parseGdelt(await r.text(), query);
  },
};

// ------------------------------------------------------------------ TheNewsAPI
const TNA_LANGS = new Set("ar bg bn cs da de el en es et fa fi fr he hi hr hu id it ja ko lt nl no pl pt ro ru sk sv ta th tr uk vi zh".split(" "));

export function parseTheNewsApi(body: string, query: string): RawArticle[] {
  const j = JSON.parse(body) as { data?: Record<string, string>[]; error?: { code?: string; message?: string } };
  if (j.error) {
    if (/limit|quota|usage/i.test(j.error.code ?? "")) throw new RateLimitError(`TheNewsAPI: ${j.error.code}`, 6 * 3600_000);
    throw new ProviderError(`TheNewsAPI: ${j.error.code} ${j.error.message ?? ""}`, 400);
  }
  return (j.data ?? []).filter((a) => a.url && a.title).map((a) => ({
    provider: "thenewsapi",
    external_id: a.uuid ?? null,
    url: a.url,
    title: a.title.trim(),
    description: a.description || null,
    storage_right: "snippet" as const,
    publisher: a.source ?? null,
    language: a.language ?? null,
    source_country: a.locale ? a.locale.toUpperCase() : null,
    published_at: a.published_at ?? null,
    query,
  }));
}

export const theNewsApi: SearchProvider = {
  key: "thenewsapi",
  langParam: (l) => (TNA_LANGS.has(l) ? l : null),
  async search(spec, w, ctx) {
    const token = ctx.env("THENEWSAPI_TOKEN");
    if (!token) throw new ProviderError("THENEWSAPI_TOKEN tanımlı değil", 401);
    const search = theNewsApiQuery(spec);
    const url = "https://api.thenewsapi.com/v1/news/all?" + new URLSearchParams({
      api_token: token, search, search_fields: "title,description,keywords", language: spec.lang,
      published_after: w.from.toISOString().slice(0, 19), published_before: w.to.toISOString().slice(0, 19),
      sort: "published_on", limit: String(ctx.config?.limit ?? 3),
    });
    const r = await fetchWithRetry(url, {}, ctx.retry);
    return parseTheNewsApi(await r.text(), search);
  },
};

// ------------------------------------------------------------------ NewsAPI.org
const NEWSAPI_LANGS = new Set("ar de en es fr he it nl no pt ru sv zh".split(" "));   // tr ve pl desteklenmiyor

export function parseNewsApi(body: string, query: string): RawArticle[] {
  const j = JSON.parse(body) as { status: string; code?: string; message?: string; articles?: Record<string, unknown>[] };
  if (j.status !== "ok") {
    if (j.code === "rateLimited" || j.code === "maximumResultsReached") throw new RateLimitError(`NewsAPI: ${j.code}`, 6 * 3600_000);
    throw new ProviderError(`NewsAPI: ${j.code} ${j.message ?? ""}`, 400);
  }
  return (j.articles ?? []).filter((a) => a.url && a.title && a.title !== "[Removed]").map((a) => ({
    provider: "newsapi",
    external_id: null,
    url: a.url as string,
    title: (a.title as string).trim(),
    description: (a.description as string) || null,   // "content" alanı (kesik metin) saklanmaz
    storage_right: "snippet" as const,
    publisher: ((a.source as { name?: string })?.name) ?? null,
    language: null,
    source_country: null,
    published_at: (a.publishedAt as string) ?? null,
    query,
  }));
}

export const newsApi: SearchProvider = {
  key: "newsapi",
  langParam: (l) => (NEWSAPI_LANGS.has(l) ? l : null),
  async search(spec, w, ctx) {
    const key = ctx.env("NEWSAPI_KEY");
    if (!key) throw new ProviderError("NEWSAPI_KEY tanımlı değil", 401);
    const q = newsApiQuery(spec);
    const url = "https://newsapi.org/v2/everything?" + new URLSearchParams({
      q, searchIn: "title,description", language: spec.lang, from: w.from.toISOString().slice(0, 19),
      to: w.to.toISOString().slice(0, 19), sortBy: "publishedAt", pageSize: String(ctx.config?.pageSize ?? 100),
    });
    const r = await fetchWithRetry(url, { headers: { "X-Api-Key": key } }, ctx.retry);
    return parseNewsApi(await r.text(), q);
  },
};

export const SEARCH_PROVIDERS: Record<string, SearchProvider> = { gdelt, thenewsapi: theNewsApi, newsapi: newsApi };

// ------------------------------------------------------------------ RSS / Atom (resmi haber odaları, sektör yayınları)
const tag = (x: string, t: string) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i")); return m ? m[1] : ""; };

export function parseRss(xml: string, feed: { name: string; lang?: string | null }): RawArticle[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  const out: RawArticle[] = [];
  for (const b of blocks) {
    let link = stripHtml(tag(b, "link"));
    if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/i); link = m ? decodeEntities(m[1]) : ""; }
    const title = stripHtml(tag(b, "title"));
    if (!link || !title) continue;
    const d = stripHtml(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
    const t = Date.parse(d);
    let desc = stripHtml(tag(b, "description") || tag(b, "summary"));
    if (desc.length > 300) desc = desc.slice(0, 297).replace(/\s+\S*$/, "") + "…";
    out.push({
      provider: "rss", external_id: stripHtml(tag(b, "guid") || tag(b, "id")) || null, url: link, title,
      description: desc || null, storage_right: "snippet", publisher: feed.name, language: feed.lang ?? null,
      source_country: null, published_at: isNaN(t) ? null : new Date(t).toISOString(),
    });
  }
  return out;
}

/** Bir web sayfasındaki RSS/Atom bağlantılarını bulur (resmi haber odası için besleme keşfi; adres uydurulmaz). */
export function discoverFeeds(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const t = m[0];
    if (!/rel=["']?alternate/i.test(t) || !/type=["']?application\/(rss|atom)\+xml/i.test(t)) continue;
    const h = /href=["']([^"']+)["']/i.exec(t);
    if (h) { try { out.push(new URL(decodeEntities(h[1]), baseUrl).toString()); } catch { /* geçersiz */ } }
  }
  return [...new Set(out)];
}

export async function fetchRss(feed: { url: string; name: string; lang?: string | null; etag?: string | null; last_modified?: string | null }, ctx: ProviderContext) {
  const headers: Record<string, string> = { "User-Agent": "COATNEWS-BrandIntelligence/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" };
  if (feed.etag) headers["If-None-Match"] = feed.etag;
  if (feed.last_modified) headers["If-Modified-Since"] = feed.last_modified;
  const r = await fetchWithRetry(feed.url, { headers }, ctx.retry);
  if (r.status === 304) return { items: [] as RawArticle[], etag: feed.etag ?? null, last_modified: feed.last_modified ?? null, notModified: true };
  return { items: parseRss(await r.text(), feed), etag: r.headers.get("etag"), last_modified: r.headers.get("last-modified"), notModified: false };
}
