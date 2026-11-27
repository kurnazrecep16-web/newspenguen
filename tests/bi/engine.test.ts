// Global Brand Intelligence motoru testleri. Çalıştırma: npm run test:bi
// Fixture'lar TEST VERİSİDİR; example.* alan adları kullanılır, canlı haber değildir.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { entitiesFromSeed } from "../../supabase/functions/_shared/bi/seed.ts";
import { resolveMentions, mainSubject } from "../../supabase/functions/_shared/bi/resolve.ts";
import { classifySegments, classifyTopics, coatingsContext, contentType, detectCountry } from "../../supabase/functions/_shared/bi/classify.ts";
import { analyze } from "../../supabase/functions/_shared/bi/pipeline.ts";
import { canonicalUrl, cleanTitle, findDuplicate, hamming, simhash } from "../../supabase/functions/_shared/bi/dedup.ts";
import { band, decide, DEFAULT_PUBLISHING, scoreArticle } from "../../supabase/functions/_shared/bi/score.ts";
import { buildQuerySpecs, gdeltQuery, newsApiQuery, pickSlice, theNewsApiQuery } from "../../supabase/functions/_shared/bi/queries.ts";
import type { RawArticle } from "../../supabase/functions/_shared/bi/types.ts";

const seed = JSON.parse(readFileSync(new URL("../../supabase/seed/brands.json", import.meta.url), "utf8"));
const E = entitiesFromSeed(seed.entities);
const id = (slug: string) => `seed:${slug}`;
const art = (title: string, description = "", extra: Partial<RawArticle> = {}): RawArticle =>
  ({ provider: "test", url: "https://news.example.com/a", title, description, storage_right: "snippet", published_at: new Date().toISOString(), ...extra });
const NOW = Date.now();

// ------------------------------------------------------------ alias çözümleme
test("alias: resmi ad ve alias'lar aynı varlığa çözülür", () => {
  for (const t of ["Jotun opens new plant", "Jotun Paints expands", "JOTUN COATINGS invests", "Jotun A/S results"]) {
    const m = resolveMentions(t, "", E, { coatingsContext: true });
    assert.deepEqual(m.map((x) => x.slug), ["jotun"], t);
  }
  const m = resolveMentions("Sherwin Williams buys plant", "", E, { coatingsContext: true });
  assert.equal(m[0].slug, "sherwin-williams");
});

test("alias: en uzun eşleşme kazanır (Jotun Türkiye ana şirket Jotun'a ayrıca sayılmaz)", () => {
  const m = resolveMentions("Jotun Türkiye Dilovası'nda kapasite artırıyor", "", E, { coatingsContext: true });
  assert.deepEqual(m.map((x) => x.slug), ["jotun-turkiye"]);
});

test("alias: Türkçe karakter katlama (JOTUN TÜRKİYE / Jotun Turkiye)", () => {
  assert.equal(resolveMentions("JOTUN TÜRKİYE yeni ürün", "", E, { coatingsContext: true })[0].slug, "jotun-turkiye");
  assert.equal(resolveMentions("Jotun Turkiye yeni urun", "", E, { coatingsContext: true })[0].slug, "jotun-turkiye");
});

test("alias: ürün ailesi markaya bağlanır", () => {
  const m = resolveMentions("Hempaguard X7 selected for 12 bulk carriers", "", E, { coatingsContext: true });
  assert.equal(m[0].slug, "hempel");
  assert.deepEqual(m[0].via, ["Hempaguard"]);
});

test("alias: kelime sınırı — 'Hempelmann' Hempel değildir", () => {
  assert.equal(resolveMentions("Hempelmann wins award", "", E, { coatingsContext: true }).length, 0);
});

test("alias: Çince ad", () => {
  const m = resolveMentions("佐敦涂料在中国新建工厂", "", E, { coatingsContext: true });
  assert.equal(m[0].slug, "jotun");
});

// ------------------------------------------------------------ belirsiz adlar
test("belirsiz: 'Marshall' kaplama bağlamı olmadan sayılmaz", () => {
  assert.equal(resolveMentions("Marshall launches new speaker", "", E, { coatingsContext: false }).length, 0);
});

test("belirsiz: dışlama kelimesi varsa bağlam olsa da düşer", () => {
  const m = resolveMentions("Marshall Islands registry adds paint rules for ships", "", E, { coatingsContext: true });
  assert.equal(m.find((x) => x.slug === "marshall"), undefined);
});

test("belirsiz: 'Marshall Boya' belirsiz değildir", () => {
  const m = resolveMentions("Marshall Boya yeni renk kartelasını tanıttı", "", E, { coatingsContext: false });
  assert.equal(m[0].slug, "marshall");
  assert.equal(m[0].ambiguous_only, false);
});

test("belirsiz: PPG büyük/küçük harf duyarlı; 'ppg sensor' sayılmaz", () => {
  assert.equal(resolveMentions("New ppg wearable", "", E, { coatingsContext: true }).length, 0);
  assert.equal(resolveMentions("PPG sensor accuracy study", "coating of the lens", E, { coatingsContext: true }).length, 0);
  assert.equal(resolveMentions("PPG raises coatings prices", "", E, { coatingsContext: true })[0].slug, "ppg");
});

test("belirsiz: Helios Kliniken bir boya haberi değildir", () => {
  assert.equal(resolveMentions("Helios Kliniken renoviert Fassade mit neuer Farbe", "", E, { coatingsContext: true }).length, 0);
});

test("ortak alias: Dulux ülke bağlamıyla çözülür, yoksa incelemeye işaretlenir", () => {
  const au = resolveMentions("Dulux unveils colour of the year", "", E, { coatingsContext: true, country: "AU" });
  assert.deepEqual(au.map((x) => x.slug), ["duluxgroup"]);
  const none = resolveMentions("Dulux unveils colour of the year", "", E, { coatingsContext: true });
  assert.equal(none.length, 2);
  assert.ok(none.every((x) => x.shared_with?.length));
  assert.equal(mainSubject(none, "Dulux unveils colour of the year"), null);
});

// ------------------------------------------------------------ çoklu marka ve ana konu
test("çoklu marka: Jotun ve Hempel birlikte tespit edilir, ana konu başlıktaki ilk marka", () => {
  const t = "Jotun and Hempel win coatings contracts for offshore wind monopiles";
  const m = resolveMentions(t, "", E, { coatingsContext: true });
  assert.deepEqual(m.map((x) => x.slug).sort(), ["hempel", "jotun"]);
  assert.equal(mainSubject(m, t)?.slug, "jotun");
});

test("ana konu: gövdede tek geçiş ana konu yapmaz", () => {
  const t = "Shipyard orders surge in Q3";
  const m = resolveMentions(t, "Several yards reported strong demand. Suppliers such as Jotun were also mentioned.", E, { coatingsContext: true });
  assert.equal(m[0].slug, "jotun");
  assert.equal(mainSubject(m, t), null);
});

test("kanıt: eşleşme metinden birebir alıntılanır", () => {
  const m = resolveMentions("AkzoNobel opens powder coatings plant in Vietnam", "", E, { coatingsContext: true });
  assert.ok(m[0].evidence[0].includes("AkzoNobel opens powder"));
});

// ------------------------------------------------------------ bağlam ve segmentler
test("bağlam: 10 dilde boya/kaplama terimi", () => {
  for (const t of ["new coatings line", "yeni boya fabrikası", "neue Beschichtung", "nouvelle peinture", "nuove vernici",
    "nuevas pinturas", "nieuwe verf", "novas tintas", "nowe farby", "新型涂料"]) assert.ok(coatingsContext(t).present, t);
  assert.equal(coatingsContext("quarterly football results").present, false);
});

test("segment: yalnızca beş ana segment; endüstriyel → protective", () => {
  const s = classifySegments("Industrial coatings demand rises in heavy-duty anti-corrosion market");
  assert.equal(s[0].key, "protective");
  for (const x of classifySegments("automotive refinish and industrial wood coatings")) {
    assert.ok(["marine", "protective", "powder", "decorative", "energy"].includes(x.key));
  }
});

test("segment: marine / powder / decorative / energy örnekleri", () => {
  assert.equal(classifySegments("antifouling hull coating for LNG carrier newbuild at shipyard")[0].key, "marine");
  assert.equal(classifySegments("toz boya tesisi açıldı")[0].key, "powder");
  assert.equal(classifySegments("Colour of the year for interior paint revealed")[0].key, "decorative");
  assert.ok(classifySegments("coating package for offshore wind farm foundations").some((x) => x.key === "energy"));
});

test("segment: mimari boya decorative altında", () => {
  assert.equal(classifySegments("architectural coatings sales grew")[0].key, "decorative");
});

// ------------------------------------------------------------ konular
test("konu: satın alma, yatırım, ürün lansmanı, ortaklık", () => {
  assert.ok(classifyTopics("PPG completes acquisition of a powder coatings maker", ["powder"], true).codes.includes("E"));
  assert.ok(classifyTopics("Jotun to build new factory, capacity +40%", ["protective"], true).codes.includes("B"));
  assert.ok(classifyTopics("Hempel launches new antifouling", ["marine"], true).codes.includes("C"));
  assert.ok(classifyTopics("Distributor agreement signed with DYO", ["decorative"], true).codes.includes("F"));
  assert.ok(classifyTopics("Filli Boya yeni fabrika yatırımı", ["decorative"], true).codes.includes("A"));
});

test("konu: ana konu marka yoksa O (dolaylı geçiş) eklenir", () => {
  assert.ok(classifyTopics("Shipyard news", ["marine"], false).codes.includes("O"));
});

test("içerik türü: basın bülteni ve sponsorlu", () => {
  assert.equal(contentType("Jotun news", true).type, "press_release");
  assert.equal(contentType("Sponsored: best paints", false).type, "sponsored");
  assert.equal(contentType("Jotun opens plant", false).type, "news");
});

test("ülke: metin ve sağlayıcı ülkesi", () => {
  assert.equal(detectCountry("New plant in Egypt", null).iso2, "EG");
  assert.equal(detectCountry("Yeni tesis", "Turkey").iso2, "TR");
});

// ------------------------------------------------------------ puanlama ve politika
test("puan: başlıkta ana konu + bağlam + güvenilir kaynak = yüksek", () => {
  const a = analyze(art("Jotun opens new protective coatings factory in Egypt", "Jotun said the plant will produce anti-corrosion coatings."), { entities: E, reliability: "high", now: NOW });
  assert.ok(a.score.overall >= 75, String(a.score.overall));
  assert.equal(a.main?.slug, "jotun");
  assert.ok(a.topics.includes("B"));
  assert.equal(a.country, "EG");
});

test("puan: kaplama bağlamı yoksa 'orta' eşiğinin altına sınırlanır", () => {
  const a = analyze(art("Jotun Arena hosts handball final"), { entities: E, reliability: "high", now: NOW });
  assert.ok(a.score.overall < 50);
  assert.ok((a.score.breakdown.caps as string[]).includes("no_coatings_context"));
});

test("puan: bant eşikleri ayarlanabilir", () => {
  assert.equal(band(80), "high");
  assert.equal(band(80, { very_high: 95, high: 85, medium: 60 }), "medium");
});

test("politika: otomatik yayın varsayılan kapalı; açılsa bile 'published' değil 'approved'", () => {
  const s = scoreArticle({ main: null, mentions: [], coatings: true, segmentScore: 100, reliability: "high", official: false, duplicate: false });
  const high = { ...s, overall: 95, band: "very_high" as const };
  assert.equal(decide(high, { ambiguous: false, promotional: false }).status, "discovered");
  assert.equal(decide(high, { ambiguous: false, promotional: false }, { ...DEFAULT_PUBLISHING, auto_publish: true }).status, "approved");
  assert.equal(decide(high, { ambiguous: false, promotional: true }, { ...DEFAULT_PUBLISHING, auto_publish: true }).status, "discovered");
  assert.equal(decide(high, { ambiguous: true, promotional: false }, { ...DEFAULT_PUBLISHING, auto_publish: true }).status, "under_review");
  assert.equal(decide({ ...s, overall: 60 }, { ambiguous: false, promotional: false }).status, "under_review");
  assert.equal(decide({ ...s, overall: 10 }, { ambiguous: false, promotional: false }).status, "rejected");
});

test("analiz: izlenen marka yoksa reddedilir", () => {
  const a = analyze(art("Paint prices rise across Europe"), { entities: E, now: NOW });
  assert.equal(a.relevant, false);
  assert.equal(a.decision.status, "rejected");
});

// ------------------------------------------------------------ tekrar tespiti
test("kanonik URL: izleme parametreleri, www, amp, sondaki eğik çizgi", () => {
  assert.equal(canonicalUrl("http://www.example.com/news/jotun-plant/?utm_source=x&id=3#top"), "https://example.com/news/jotun-plant?id=3");
  assert.equal(canonicalUrl("https://amp.example.com/news/jotun-plant/amp/"), "https://example.com/news/jotun-plant");
});

test("başlık temizleme: yalnızca yayıncı son eki atılır", () => {
  assert.equal(cleanTitle("Jotun opens plant in Egypt - Reuters", "Reuters"), "Jotun opens plant in Egypt");
  assert.equal(cleanTitle("AkzoNobel – Axalta merger update", "Example News"), "AkzoNobel – Axalta merger update");
  assert.equal(cleanTitle("Hempel results | Example Daily"), "Hempel results");
});

test("tekrar: aynı URL", () => {
  const r = findDuplicate({ canonical_url: "https://a.example/x", title: "x" }, [{ canonical_url: "https://a.example/x", title: "y", story_id: "s1" }]);
  assert.equal(r.kind, "same_url");
});

test("tekrar: benzer başlık farklı yayıncıda aynı haber olarak gruplanır", () => {
  const d = new Date().toISOString();
  const r = findDuplicate(
    { canonical_url: "https://b.example/2", title: "Jotun opens new coatings factory in Egypt's Suez Canal zone", published_at: d },
    [{ canonical_url: "https://a.example/1", title: "Jotun opens new coatings factory in Suez Canal Economic Zone, Egypt", published_at: d, story_id: "s1" }]);
  assert.equal(r.kind, "same_story");
});

test("tekrar: aynı basın bülteni (sendikasyon) simhash ile yakalanır", () => {
  const desc = "Hempel today announced the opening of its new manufacturing facility, which will produce protective and marine coatings for customers across the region and create 150 jobs.";
  const r = findDuplicate(
    { canonical_url: "https://b.example/2", title: "Hempel announces new plant", description: desc },
    [{ canonical_url: "https://a.example/1", title: "New manufacturing facility opened by Hempel", description: desc + " ", story_id: "s1" }]);
  assert.equal(r.kind, "same_story");
  assert.ok(hamming(simhash(desc), simhash(desc + " extra")) < 10);
});

test("tekrar: farklı olaylar ayrı kalır; tarih penceresi dışı ayrı", () => {
  const r1 = findDuplicate({ canonical_url: "https://b.example/2", title: "Jotun opens factory in Egypt" },
    [{ canonical_url: "https://a.example/1", title: "Hempel acquires Polish distributor", story_id: "s1" }]);
  assert.equal(r1.kind, "new");
  const r2 = findDuplicate({ canonical_url: "https://b.example/2", title: "Jotun opens new coatings factory in Egypt", published_at: "2026-11-20T00:00:00Z" },
    [{ canonical_url: "https://a.example/1", title: "Jotun opens new coatings factory in Egypt", published_at: "2026-10-01T00:00:00Z", story_id: "s1" }]);
  assert.equal(r2.kind, "new");
});

// ------------------------------------------------------------ çok dilli sorgular
const TERMS = seed.query_terms;

test("sorgu: 10 dil için sorgu üretilir, belirsiz alias aramaya girmez", () => {
  const specs = buildQuerySpecs(E, TERMS);
  const langs = new Set(specs.map((s) => s.lang));
  for (const l of ["en", "tr", "de", "fr", "it", "es", "nl", "pt", "pl", "zh"]) assert.ok(langs.has(l), l);
  const all = specs.flatMap((s) => s.aliases);
  for (const bad of ["PPG", "Marshall", "DAW", "TOA", "Sika", "Helios", "KCC", "Dulux", "Berger", "Polisan"]) assert.ok(!all.includes(bad), bad);
  assert.ok(all.includes("Jotun"));
});

test("sorgu: Türkçe bağlam terimleri ve Çince adlar yalnızca kendi dilinde", () => {
  const specs = buildQuerySpecs(E, TERMS);
  const tr = specs.find((s) => s.lang === "tr" && s.family === "context")!;
  assert.ok(tr.terms.includes("boya"));
  assert.ok(!specs.filter((s) => s.lang === "en").flatMap((s) => s.aliases).some((a) => /[㐀-鿿]/.test(a)));
  assert.ok(specs.filter((s) => s.lang === "zh").flatMap((s) => s.aliases).includes("佐敦"));
});

test("sorgu: sağlayıcı sözdizimleri", () => {
  const s = { id: "x", lang: "en", family: "business" as const, aliases: ["Jotun", "Hempel"], terms: ["factory", "product launch"], entity_slugs: [] };
  assert.equal(gdeltQuery(s, "english"), '("Jotun" OR "Hempel") (factory OR "product launch") sourcelang:english');
  assert.equal(theNewsApiQuery(s), '("Jotun" | "Hempel") + (factory | "product launch")');
  assert.equal(newsApiQuery(s), '("Jotun" OR "Hempel") AND (factory OR "product launch")');
});

test("sorgu: rotasyon imleci tüm sorguları sırayla dolaşır", () => {
  const specs = buildQuerySpecs(E, TERMS);
  const seen = new Set<string>();
  let cur = 0;
  for (let i = 0; i < Math.ceil(specs.length / 7); i++) { const r = pickSlice(specs, cur, 7); r.slice.forEach((s) => seen.add(s.id)); cur = r.next; }
  assert.equal(seen.size, specs.length);
});
