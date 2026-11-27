// COATNEWS — Global Brand Intelligence tarama işçisi (Supabase Edge Function, Deno)
//
// Akış: etkin markalar + alias'lar → çok dilli sorgular (rotasyonlu dilim) → etkin sağlayıcılar + RSS
// → normalize → alias çözümleme → kaplama bağlamı → segment/konu → puan → tekrar tespiti
// → kayıt (idempotent: kanonik URL benzersiz) → belirsizler inceleme kuyruğuna → tarama günlüğü.
//
// Tetikleme: pg_cron (x-bi-cron-secret başlığı ile) veya yönetici panelinden "Şimdi tara" (editör JWT'si).
// Ortam değişkenleri: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Supabase verir), BI_CRON_SECRET,
// isteğe bağlı THENEWSAPI_TOKEN, NEWSAPI_KEY. Anahtar değerleri veritabanına veya istemciye yazılmaz.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { Entity, RawArticle } from "../_shared/bi/types.ts";
import { buildQuerySpecs, pickSlice, type QuerySpec, type TermSet } from "../_shared/bi/queries.ts";
import { SEARCH_PROVIDERS, fetchRss } from "../_shared/bi/providers/index.ts";
import { RateLimitError } from "../_shared/bi/http.ts";
import { analyze } from "../_shared/bi/pipeline.ts";
import { canonicalUrl, domainOf, findDuplicate, simhash, titleKey, cleanTitle, type DedupExisting } from "../_shared/bi/dedup.ts";
import { DEFAULT_PUBLISHING, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, type Reliability } from "../_shared/bi/score.ts";

type Log = { level: "info" | "warn" | "error"; provider_key?: string; message: string; data?: unknown };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function authorized(req: Request, sb: SupabaseClient): Promise<string | null> {
  const secret = Deno.env.get("BI_CRON_SECRET");
  if (secret && req.headers.get("x-bi-cron-secret") === secret) return "cron";
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await sb.auth.getUser(jwt);
  if (!data?.user) return null;
  const { data: staff } = await sb.from("bi_staff").select("role").eq("user_id", data.user.id).maybeSingle();
  return staff ? "manual" : null;
}

async function loadEntities(sb: SupabaseClient): Promise<Entity[]> {
  const { data: ents, error } = await sb.from("bi_entities")
    .select("id,slug,name,entity_type,parent_id,country_iso2,segments,product_families,exclusion_keywords,search_keywords,languages,priority,is_active")
    .eq("is_active", true).is("merged_into_id", null);
  if (error) throw error;
  const { data: al } = await sb.from("bi_entity_aliases").select("entity_id,alias,is_ambiguous,case_sensitive,lang,use_in_search");
  const by = new Map<string, Entity["aliases"]>();
  for (const a of al ?? []) { const l = by.get(a.entity_id) ?? []; l.push(a); by.set(a.entity_id, l); }
  return (ents ?? []).map((e) => ({ ...e, aliases: by.get(e.id) ?? [{ alias: e.name }] })) as Entity[];
}

async function loadTerms(sb: SupabaseClient): Promise<Record<string, TermSet>> {
  const { data: langs } = await sb.from("bi_languages").select("code").eq("is_active", true);
  const active = new Set((langs ?? []).map((l) => l.code));
  const { data } = await sb.from("bi_query_terms").select("lang,term,kind").eq("is_active", true);
  const out: Record<string, TermSet> = {};
  for (const t of data ?? []) {
    if (!active.has(t.lang) || t.kind === "segment") continue;
    (out[t.lang] ??= { context: [], business: [] })[t.kind as "context" | "business"].push(t.term);
  }
  return out;
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const trigger = await authorized(req, sb);
  if (!trigger) return new Response(JSON.stringify({ error: "yetkisiz" }), { status: 401 });

  const settings = Object.fromEntries(((await sb.from("bi_settings").select("key,value")).data ?? []).map((r) => [r.key, r.value]));
  const scan = { interval_minutes: 60, overlap_minutes: 30, time_budget_ms: 120000, queries_per_run: 18, ...(settings.scan ?? {}) };
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(settings.thresholds ?? {}) };
  const weights = { ...DEFAULT_WEIGHTS, ...(settings.weights ?? {}) };
  const publishing = { ...DEFAULT_PUBLISHING, ...(settings.publishing ?? {}) };
  const cursor = Number(settings.scan_cursor?.value ?? 0);

  // Örtüşen pencere: son başarılı turun bitişinden overlap kadar geri
  const { data: last } = await sb.from("bi_scan_runs").select("window_to").in("status", ["ok", "partial"]).order("started_at", { ascending: false }).limit(1).maybeSingle();
  const to = new Date();
  const fromDefault = to.getTime() - (scan.interval_minutes + scan.overlap_minutes) * 60_000;
  const from = new Date(Math.max(to.getTime() - 3 * 864e5, Math.min(fromDefault, last?.window_to ? Date.parse(last.window_to) - scan.overlap_minutes * 60_000 : fromDefault)));

  const { data: run } = await sb.from("bi_scan_runs").insert({ trigger, window_from: from.toISOString(), window_to: to.toISOString() }).select("id").single();
  const runId = run!.id as string;
  const logs: Log[] = [];
  const stats: Record<string, number | Record<string, number>> = { candidates: 0, relevant: 0, new_stories: 0, merged: 0, skipped_existing: 0, review: 0, rejected: 0, per_provider: {} };
  const per = stats.per_provider as Record<string, number>;
  let status: "ok" | "partial" | "failed" = "ok";

  try {
    const entities = await loadEntities(sb);
    const terms = await loadTerms(sb);
    const specs = buildQuerySpecs(entities, terms);
    const { slice, next } = pickSlice(specs, cursor, scan.queries_per_run);
    const { data: providers } = await sb.from("bi_providers").select("*");
    const today = to.toISOString().slice(0, 10);
    const candidates: RawArticle[] = [];

    // ---------------------------------------------------------------- arama sağlayıcıları
    for (const p of providers ?? []) {
      const impl = SEARCH_PROVIDERS[p.key];
      if (!impl || !p.is_enabled) continue;
      const upd: Record<string, unknown> = { last_attempt_at: new Date().toISOString() };
      if (p.rate_limited_until && Date.parse(p.rate_limited_until) > Date.now()) { logs.push({ level: "warn", provider_key: p.key, message: `hız sınırı ${p.rate_limited_until} tarihine kadar` }); continue; }
      if (p.requires_key && !Deno.env.get(p.key_env)) {
        await sb.from("bi_providers").update({ ...upd, last_error: `${p.key_env} ortam değişkeni tanımlı değil` }).eq("key", p.key);
        logs.push({ level: "warn", provider_key: p.key, message: "anahtar yok, atlandı" });
        continue;
      }
      let used = p.quota_day === today ? p.used_today : 0, got = 0, errors = 0;
      for (const spec of slice as QuerySpec[]) {
        if (Date.now() - t0 > scan.time_budget_ms) { status = "partial"; logs.push({ level: "warn", provider_key: p.key, message: "zaman bütçesi doldu" }); break; }
        if (!impl.langParam(spec.lang)) continue;
        if (p.daily_quota && used >= p.daily_quota) { logs.push({ level: "warn", provider_key: p.key, message: "günlük kota doldu" }); break; }
        try {
          const items = await impl.search(spec, { from, to }, { env: (k) => Deno.env.get(k), config: p.config });
          used++; got += items.length; candidates.push(...items);
        } catch (e) {
          used++;
          if (e instanceof RateLimitError) {
            upd.rate_limited_until = new Date(Date.now() + e.retryAfterMs).toISOString();
            logs.push({ level: "warn", provider_key: p.key, message: e.message, data: { spec: spec.id } });
            break;
          }
          errors++;
          logs.push({ level: "error", provider_key: p.key, message: String((e as Error).message ?? e).slice(0, 300), data: { spec: spec.id } });
          if (errors >= 3) { status = "partial"; break; }
        }
        if (p.min_interval_ms) await sleep(p.min_interval_ms);
      }
      per[p.key] = got;
      Object.assign(upd, { used_today: used, quota_day: today, articles_retrieved: Number(p.articles_retrieved) + got });
      if (errors === 0) Object.assign(upd, { last_success_at: new Date().toISOString(), consecutive_errors: 0, last_error: null });
      else Object.assign(upd, { consecutive_errors: p.consecutive_errors + 1, last_error: logs.filter((l) => l.provider_key === p.key && l.level === "error").at(-1)?.message ?? null });
      await sb.from("bi_providers").update(upd).eq("key", p.key);
    }

    // ---------------------------------------------------------------- RSS / resmi haber odaları
    const rssProv = (providers ?? []).find((p) => p.key === "rss");
    if (rssProv?.is_enabled) {
      const { data: feeds } = await sb.from("bi_feeds").select("*").eq("is_active", true);
      let got = 0;
      for (const f of feeds ?? []) {
        if (Date.now() - t0 > scan.time_budget_ms) { status = "partial"; break; }
        try {
          const r = await fetchRss(f, { env: (k) => Deno.env.get(k), retry: { retries: 1 } });
          const fresh = r.items.filter((i) => !i.published_at || Date.parse(i.published_at) >= from.getTime() - 864e5);
          fresh.forEach((i) => ((i as RawArticle & { feed_entity?: string }).feed_entity = f.entity_id ?? undefined));
          candidates.push(...fresh); got += fresh.length;
          await sb.from("bi_feeds").update({ etag: r.etag, last_modified: r.last_modified, last_attempt_at: new Date().toISOString(), last_success_at: new Date().toISOString(), last_error: null, consecutive_errors: 0, items_seen: Number(f.items_seen) + r.items.length }).eq("id", f.id);
        } catch (e) {
          const msg = String((e as Error).message ?? e).slice(0, 300);
          logs.push({ level: "error", provider_key: "rss", message: `${f.name}: ${msg}` });
          await sb.from("bi_feeds").update({ last_attempt_at: new Date().toISOString(), last_error: msg, consecutive_errors: f.consecutive_errors + 1 }).eq("id", f.id);
        }
      }
      per.rss = got;
    }

    // ---------------------------------------------------------------- normalize + mevcutları ele
    stats.candidates = candidates.length;
    const byUrl = new Map<string, RawArticle>();
    for (const c of candidates) { const k = canonicalUrl(c.url); if (!byUrl.has(k)) byUrl.set(k, c); }
    const urls = [...byUrl.keys()];
    const existing = new Set<string>();
    for (let i = 0; i < urls.length; i += 200) {
      const { data } = await sb.from("bi_articles").select("canonical_url").in("canonical_url", urls.slice(i, i + 200));
      (data ?? []).forEach((r) => existing.add(r.canonical_url));
    }
    stats.skipped_existing = existing.size;

    const { data: srcRows } = await sb.from("bi_sources").select("domain,reliability,is_official,is_blocked,entity_id");
    const src = new Map((srcRows ?? []).map((s) => [s.domain, s]));
    const { data: recent } = await sb.from("bi_articles").select("story_id,canonical_url,title,description,published_at,simhash")
      .gte("published_at", new Date(Date.now() - 6 * 864e5).toISOString()).limit(5000);
    const pool: DedupExisting[] = (recent ?? []).map((r) => ({ ...r, simhash: r.simhash != null ? BigInt(r.simhash) : null }));
    const touched = new Set<string>();

    for (const [canon, a] of byUrl) {
      if (existing.has(canon)) continue;
      const domain = domainOf(canon);
      const s = src.get(domain);
      if (s?.is_blocked) continue;
      const official = !!s?.is_official || !!(a as RawArticle & { feed_entity?: string }).feed_entity;
      const an = analyze(a, { entities, reliability: (s?.reliability ?? "unknown") as Reliability, official, weights, thresholds, publishing });
      if (!an.relevant) continue;
      stats.relevant = (stats.relevant as number) + 1;
      const dup = findDuplicate({ canonical_url: canon, title: a.title, description: a.description, published_at: a.published_at }, pool);
      const sh = a.description && a.description.length > 60 ? simhash(a.description) : null;
      const articleRow = {
        provider_key: a.provider, external_id: a.external_id ?? null, url: a.url, canonical_url: canon, title: a.title,
        title_norm: titleKey(a.title), description: a.storage_right === "snippet" ? a.description ?? null : null,
        storage_right: a.storage_right, publisher: a.publisher ?? domain, source_domain: domain, language: a.language ?? null,
        source_country: a.source_country ?? null, published_at: a.published_at ?? null, simhash: sh?.toString() ?? null,
      };

      let storyId: string;
      if (dup.kind === "same_story") {
        storyId = dup.story_id;
        const { data: ins } = await sb.from("bi_articles").upsert({ ...articleRow, story_id: storyId, is_syndicated: true }, { onConflict: "canonical_url", ignoreDuplicates: true }).select("id");
        if (!ins?.length) continue;
        const { data: st } = await sb.from("bi_stories").select("source_count,first_published_at").eq("id", storyId).single();
        const earlier = a.published_at && (!st?.first_published_at || Date.parse(a.published_at) < Date.parse(st.first_published_at));
        await sb.from("bi_stories").update({ source_count: (st?.source_count ?? 1) + 1, ...(earlier ? { first_published_at: a.published_at } : {}) }).eq("id", storyId);
        stats.merged = (stats.merged as number) + 1;
      } else {
        storyId = crypto.randomUUID();
        const st = an.decision.status;
        const { error: se } = await sb.from("bi_stories").insert({
          id: storyId, status: st, title: cleanTitle(a.title, a.publisher), language: a.language ?? null, country_iso2: an.country, region: an.region,
          segments: an.segments.map((x) => x.key), topics: an.topics, main_entity_id: an.main?.entity_id ?? null,
          content_type: an.content.type, is_promotional: an.content.promotional, first_published_at: a.published_at ?? null,
          brand_score: an.score.brand, segment_score: an.score.segment, source_confidence: an.score.source, overall_score: an.score.overall,
          score_breakdown: { ...an.score.breakdown, band: an.score.band, freshness: an.score.freshness, coatings_evidence: an.coatings.evidence, topic_evidence: an.topicEvidence, query: a.query ?? null },
          review_reason: an.decision.reason,
        });
        if (se) { logs.push({ level: "error", message: `story insert: ${se.message}` }); continue; }
        const { data: ins } = await sb.from("bi_articles").upsert({ ...articleRow, story_id: storyId }, { onConflict: "canonical_url", ignoreDuplicates: true }).select("id");
        if (!ins?.length) { await sb.from("bi_stories").delete().eq("id", storyId); continue; }   // yarış: başka tur ekledi
        await sb.from("bi_stories").update({ primary_article_id: ins[0].id }).eq("id", storyId);
        if (an.segments.length) await sb.from("bi_story_segments").insert(an.segments.map((x) => ({ story_id: storyId, segment_key: x.key, score: x.score, evidence: x.evidence })));
        stats.new_stories = (stats.new_stories as number) + 1;
        if (st === "under_review") stats.review = (stats.review as number) + 1;
        if (st === "rejected") stats.rejected = (stats.rejected as number) + 1;
      }

      // Marka ilişkileri (birleşmede de birleşim kümesi korunur); ana şirket "parent" rolüyle eklenir
      const rows = an.mentions.map((m) => ({
        story_id: storyId, entity_id: m.entity_id, role: an.main?.entity_id === m.entity_id ? "main" : "mentioned",
        mention_count: m.count, in_headline: m.in_headline, evidence: m.evidence, confidence: an.score.brand,
      }));
      const parents = new Set(an.mentions.map((m) => entities.find((e) => e.id === m.entity_id)?.parent_id).filter(Boolean) as string[]);
      for (const pid of parents) if (!rows.some((r) => r.entity_id === pid)) rows.push({ story_id: storyId, entity_id: pid, role: "parent", mention_count: 0, in_headline: false, evidence: [], confidence: null as unknown as number });
      await sb.from("bi_story_entities").upsert(rows, { onConflict: "story_id,entity_id", ignoreDuplicates: true });
      an.mentions.forEach((m) => touched.add(m.entity_id));
      pool.push({ story_id: storyId, canonical_url: canon, title: a.title, description: a.description, published_at: a.published_at, simhash: sh });
    }

    // Marka sayaçları (gerçek kayıtlardan yeniden sayılır)
    for (const eid of touched) {
      const { count } = await sb.from("bi_story_entities").select("story_id", { count: "exact", head: true }).eq("entity_id", eid).neq("role", "parent");
      await sb.from("bi_entities").update({ article_count: count ?? 0 }).eq("id", eid);
    }
    const scanned = new Set(slice.flatMap((s) => s.entity_slugs));
    if (scanned.size) await sb.from("bi_entities").update({ last_scan_at: new Date().toISOString() }).in("slug", [...scanned]);
    await sb.from("bi_settings").upsert({ key: "scan_cursor", value: { value: next, total: specs.length }, updated_at: new Date().toISOString() });
    stats.queries = slice.length;
    stats.total_queries = specs.length;
  } catch (e) {
    status = "failed";
    logs.push({ level: "error", message: String((e as Error).message ?? e).slice(0, 500) });
  }

  if (logs.length) await sb.from("bi_scan_logs").insert(logs.map((l) => ({ run_id: runId, ...l })));
  if (status === "ok" && logs.some((l) => l.level === "error")) status = "partial";
  await sb.from("bi_scan_runs").update({ status, finished_at: new Date().toISOString(), stats, error: status === "failed" ? logs.at(-1)?.message : null }).eq("id", runId);
  return new Response(JSON.stringify({ run: runId, status, stats, ms: Date.now() - t0 }), { headers: { "Content-Type": "application/json" } });
});
