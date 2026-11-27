// COATNEWS — Brand Intelligence yönetici yardımcıları (yalnızca editör / yönetici)
// Tarayıcıdan yapılamayan (CORS) işler: resmi siteden RSS keşfi, besleme denemesi, sorgu önizlemesi.
// İstek: POST { action: "discover_feeds", url } | { action: "test_feed", url } | { action: "preview_queries" }
import { createClient } from "npm:@supabase/supabase-js@2";
import { discoverFeeds, fetchRss } from "../_shared/bi/providers/index.ts";
import { fetchWithRetry } from "../_shared/bi/http.ts";
import { buildQuerySpecs, gdeltQuery, newsApiQuery, theNewsApiQuery, type TermSet } from "../_shared/bi/queries.ts";
import type { Entity } from "../_shared/bi/types.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

function safeUrl(u: string): URL | null {
  try {
    const x = new URL(u);
    if (x.protocol !== "https:" && x.protocol !== "http:") return null;
    // Yerel / özel ağ adreslerine istek atılmaz (SSRF koruması)
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1|0\.0\.0\.0)/i.test(x.hostname) || x.hostname.endsWith(".internal")) return null;
    return x;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = jwt ? await sb.auth.getUser(jwt) : { data: null };
  if (!u?.user) return json({ error: "yetkisiz" }, 401);
  const { data: staff } = await sb.from("bi_staff").select("role").eq("user_id", u.user.id).maybeSingle();
  if (!staff) return json({ error: "yalnızca editörler" }, 403);

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "discover_feeds") {
      const url = safeUrl(String(body.url ?? ""));
      if (!url) return json({ error: "geçersiz adres" }, 400);
      const r = await fetchWithRetry(url.toString(), { headers: { "User-Agent": "COATNEWS-BrandIntelligence/1.0", Accept: "text/html" } }, { retries: 1, timeoutMs: 15000 });
      const html = (await r.text()).slice(0, 500_000);
      return json({ url: url.toString(), feeds: discoverFeeds(html, r.url || url.toString()) });
    }
    if (body.action === "test_feed") {
      const url = safeUrl(String(body.url ?? ""));
      if (!url) return json({ error: "geçersiz adres" }, 400);
      const r = await fetchRss({ url: url.toString(), name: url.hostname }, { env: () => undefined, retry: { retries: 1, timeoutMs: 15000 } });
      return json({ items: r.items.length, sample: r.items.slice(0, 5).map((i) => ({ title: i.title, url: i.url, published_at: i.published_at })) });
    }
    if (body.action === "preview_queries") {
      const { data: ents } = await sb.from("bi_entities").select("id,slug,name,entity_type,parent_id,country_iso2,segments,product_families,exclusion_keywords,languages,priority,is_active").eq("is_active", true).is("merged_into_id", null);
      const { data: al } = await sb.from("bi_entity_aliases").select("entity_id,alias,is_ambiguous,case_sensitive,lang,use_in_search");
      const { data: langs } = await sb.from("bi_languages").select("code").eq("is_active", true);
      const { data: qt } = await sb.from("bi_query_terms").select("lang,term,kind").eq("is_active", true);
      const terms: Record<string, TermSet> = {};
      const act = new Set((langs ?? []).map((l) => l.code));
      for (const t of qt ?? []) if (act.has(t.lang) && t.kind !== "segment") (terms[t.lang] ??= { context: [], business: [] })[t.kind as "context" | "business"].push(t.term);
      const E = (ents ?? []).map((e) => ({ ...e, aliases: (al ?? []).filter((a) => a.entity_id === e.id) })) as Entity[];
      const specs = buildQuerySpecs(E, terms);
      return json({ total: specs.length, queries: specs.map((s) => ({ id: s.id, lang: s.lang, family: s.family, gdelt: gdeltQuery(s), thenewsapi: theNewsApiQuery(s), newsapi: (() => { try { return newsApiQuery(s); } catch (e) { return String((e as Error).message); } })() })) });
    }
    return json({ error: "bilinmeyen işlem" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e).slice(0, 300) }, 502);
  }
});
