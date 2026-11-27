// Sağlayıcı adaptörleri: yanıt ayrıştırma, hata ve hız sınırı davranışı, yeniden deneme.
// Yanıt fixture'ları sağlayıcı belgelerindeki alan adlarına göre elle yazılmıştır (TEST VERİSİ).
import test from "node:test";
import assert from "node:assert/strict";
import { discoverFeeds, gdeltSeenDate, parseBingNews, parseGdelt, parseNewsApi, parseRss, parseTheNewsApi } from "../../supabase/functions/_shared/bi/providers/index.ts";
import { bingQuery } from "../../supabase/functions/_shared/bi/queries.ts";
import { fetchWithRetry, ProviderError, RateLimitError } from "../../supabase/functions/_shared/bi/http.ts";

test("GDELT: ArtList JSON ayrıştırılır, tam metin saklanmaz", () => {
  const body = JSON.stringify({ articles: [
    { url: "https://news.example.com/jotun", url_mobile: "", title: "Jotun opens plant", seendate: "20261127T153000Z", socialimage: "", domain: "news.example.com", language: "English", sourcecountry: "Egypt" },
    { url: "", title: "no url" },
  ] });
  const r = parseGdelt(body, "q");
  assert.equal(r.length, 1);
  assert.equal(r[0].language, "en");
  assert.equal(r[0].published_at, "2026-11-27T15:30:00Z");
  assert.equal(r[0].storage_right, "link_only");
  assert.equal(r[0].description, null);
});

test("GDELT: boş yanıt, hız sınırı metni ve hata metni", () => {
  assert.deepEqual(parseGdelt("", "q"), []);
  assert.throws(() => parseGdelt("Please limit requests to one every 5 seconds", "q"), RateLimitError);
  assert.throws(() => parseGdelt("The specified phrase is too short.", "q"), ProviderError);
  assert.equal(gdeltSeenDate("bad"), null);
});

test("TheNewsAPI: veri ve kota hatası", () => {
  const ok = parseTheNewsApi(JSON.stringify({ meta: { found: 1 }, data: [{ uuid: "u1", title: "Hempel news", description: "d", url: "https://e.example/1", language: "en", published_at: "2026-11-27T10:00:00.000000Z", source: "e.example", locale: "us" }] }), "q");
  assert.equal(ok[0].external_id, "u1");
  assert.equal(ok[0].source_country, "US");
  assert.throws(() => parseTheNewsApi(JSON.stringify({ error: { code: "usage_limit_reached", message: "x" } }), "q"), RateLimitError);
  assert.throws(() => parseTheNewsApi(JSON.stringify({ error: { code: "invalid_api_token", message: "x" } }), "q"), ProviderError);
});

test("NewsAPI: veri, [Removed] filtresi, rateLimited", () => {
  const ok = parseNewsApi(JSON.stringify({ status: "ok", totalResults: 2, articles: [
    { source: { id: null, name: "Example" }, title: "PPG raises prices", description: "d", url: "https://e.example/2", publishedAt: "2026-11-27T09:00:00Z", content: "truncated… [+1200 chars]" },
    { source: { name: "x" }, title: "[Removed]", url: "https://removed.com" },
  ] }), "q");
  assert.equal(ok.length, 1);
  assert.equal(ok[0].publisher, "Example");
  assert.ok(!("content" in ok[0]));
  assert.throws(() => parseNewsApi(JSON.stringify({ status: "error", code: "rateLimited", message: "x" }), "q"), RateLimitError);
});

test("RSS ve Atom ayrıştırma", () => {
  const rss = `<rss><channel><item><title><![CDATA[Jotun &amp; partner sign deal]]></title><link>https://e.example/r1</link><pubDate>Thu, 26 Nov 2026 08:00:00 GMT</pubDate><description>&lt;p&gt;Short text&lt;/p&gt;</description><guid>g1</guid></item></channel></rss>`;
  const r = parseRss(rss, { name: "Example Feed", lang: "en" });
  assert.equal(r[0].title, "Jotun & partner sign deal");
  assert.equal(r[0].description, "Short text");
  assert.equal(r[0].published_at, "2026-11-26T08:00:00.000Z");
  const atom = `<feed><entry><title>Hempel update</title><link href="https://e.example/a1"/><updated>2026-11-25T10:00:00Z</updated><summary>Sum</summary></entry></feed>`;
  assert.equal(parseRss(atom, { name: "A" })[0].url, "https://e.example/a1");
});

test("Besleme keşfi: yalnızca sayfada bildirilen RSS/Atom bağlantıları", () => {
  const html = `<head><link rel="alternate" type="application/rss+xml" href="/news/rss"><link rel="stylesheet" href="/a.css"><link rel="alternate" type="application/atom+xml" href="https://e.example/atom.xml"></head>`;
  assert.deepEqual(discoverFeeds(html, "https://brand.example/en/"), ["https://brand.example/news/rss", "https://e.example/atom.xml"]);
  assert.deepEqual(discoverFeeds("<html></html>", "https://brand.example/"), []);
});

// ------------------------------------------------------------ yeniden deneme
const res = (status: number, body = "", headers: Record<string, string> = {}) => new Response(body, { status, headers });

test("yeniden deneme: 5xx üstel bekleme ile tekrar denenir", async () => {
  const waits: number[] = [];
  let n = 0;
  const r = await fetchWithRetry("https://x.example", {}, { retries: 3, baseMs: 100, sleep: async (ms) => { waits.push(ms); }, fetch: async () => (++n < 3 ? res(503) : res(200, "ok")) });
  assert.equal(await r.text(), "ok");
  assert.deepEqual(waits, [100, 200]);
});

test("yeniden deneme: ağ hatası, sonra başarısız", async () => {
  await assert.rejects(fetchWithRetry("https://x.example", {}, { retries: 2, baseMs: 1, sleep: async () => {}, fetch: async () => { throw new TypeError("network"); } }), /network/);
});

test("hız sınırı: 429 yeniden denenmez, Retry-After okunur", async () => {
  let n = 0;
  await assert.rejects(
    fetchWithRetry("https://x.example", {}, { sleep: async () => {}, fetch: async () => { n++; return res(429, "", { "retry-after": "120" }); } }),
    (e: unknown) => e instanceof RateLimitError && e.retryAfterMs === 120000);
  assert.equal(n, 1);
});

test("4xx: yeniden denenmez", async () => {
  let n = 0;
  await assert.rejects(fetchWithRetry("https://x.example", {}, { sleep: async () => {}, fetch: async () => { n++; return res(401, "bad key"); } }), ProviderError);
  assert.equal(n, 1);
});

test("Bing News RSS: asıl bağlantı, yayıncı ve tarih çıkarılır; bing.com bağlantıları atlanır", () => {
  const xml = `<?xml version="1.0"?><rss xmlns:News="https://www.bing.com/news/search?q=x&amp;format=rss"><channel>
<item><title>Jotun opens &amp;amp; expands plant</title><link>http://www.bing.com/news/apiclick.aspx?ref=FexRss&amp;aid=&amp;tid=1&amp;url=https%3a%2f%2fnews.example.com%2fjotun-plant%3futm_source%3dbing&amp;c=1</link><description>Jotun said on Monday it will expand coatings capacity.</description><pubDate>Thu, 26 Nov 2026 08:00:00 GMT</pubDate><News:Source>Example News</News:Source></item>
<item><title>Bing kendi sayfası</title><link>https://www.bing.com/news/search?q=jotun</link><pubDate>Thu, 26 Nov 2026 08:00:00 GMT</pubDate></item>
</channel></rss>`;
  const a = parseBingNews(xml, "q", "en");
  assert.equal(a.length, 1);
  assert.equal(a[0].url, "https://news.example.com/jotun-plant?utm_source=bing");
  assert.equal(a[0].publisher, "Example News");
  assert.equal(a[0].published_at, "2026-11-26T08:00:00.000Z");
  assert.equal(a[0].provider, "bingnews");
});

test("Bing sorgusu: tek marka adı tırnak içinde", () => {
  assert.equal(bingQuery('Jotun "Türkiye"'), '"Jotun Türkiye"');
});
