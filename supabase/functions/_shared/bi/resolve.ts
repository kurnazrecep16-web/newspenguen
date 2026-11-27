// Marka / alias çözümleme: metindeki geçişleri bulur, belirsiz adları bağlamla doğrular,
// iç içe adlarda (Jotun Türkiye ⊃ Jotun) en uzun eşleşmeyi seçer.
import type { Entity, Mention } from "./types.ts";
import { fold, phraseRx, snippetAround } from "./text.ts";

type Hit = { entity: Entity; via: string; start: number; end: number; field: "title" | "body"; ambiguous: boolean; text: string };

type Compiled = { entity: Entity; via: string; rx: RegExp; cs: boolean; ambiguous: boolean };

const cache = new WeakMap<Entity[], Compiled[]>();

function compile(entities: Entity[]): Compiled[] {
  const hit = cache.get(entities);
  if (hit) return hit;
  const out: Compiled[] = [];
  for (const e of entities) {
    if (e.is_active === false) continue;
    const seen = new Set<string>();
    const add = (via: string, cs: boolean, ambiguous: boolean) => {
      const k = (cs ? "c:" : "i:") + (cs ? via : fold(via));
      if (seen.has(k) || via.trim().length < 2) return;
      seen.add(k);
      out.push({ entity: e, via, rx: phraseRx(via, cs), cs, ambiguous });
    };
    for (const a of e.aliases) add(a.alias, !!a.case_sensitive, !!a.is_ambiguous);
    for (const p of e.product_families) add(p, false, false);
  }
  cache.set(entities, out);
  return out;
}

function scan(c: Compiled, raw: string, folded: string, field: "title" | "body"): Hit[] {
  const src = c.cs ? raw : folded;
  const res: Hit[] = [];
  c.rx.lastIndex = 0;
  for (let m = c.rx.exec(src); m; m = c.rx.exec(src)) {
    res.push({ entity: c.entity, via: c.via, start: m.index, end: m.index + m[0].length, field, ambiguous: c.ambiguous, text: raw });
    if (m[0].length === 0) c.rx.lastIndex++;
  }
  return res;
}

function excluded(e: Entity, folded: string): string | null {
  for (const x of e.exclusion_keywords) if (x && folded.includes(fold(x))) return x;
  return null;
}

export type ResolveOptions = {
  /** Metinde boya/kaplama bağlamı var mı (classify.coatingsContext). Belirsiz adlar için şart. */
  coatingsContext: boolean;
  /** Makalenin ülkesi (ISO2). Ortak alias'larda (Dulux) seçim için. */
  country?: string | null;
};

export function resolveMentions(title: string, body: string, entities: Entity[], opt: ResolveOptions): Mention[] {
  // fold() uzunluğu çoğu Latin metinde korur; korunmazsa katlanmamış metinde ara (konumlar kayabilir, sayım doğru kalır)
  const fT = fold(title), fB = fold(body);
  const tFold = fT.length === title.length ? fT : title.toLowerCase();
  const bFold = fB.length === body.length ? fB : body.toLowerCase();
  const all = `${fT} ${fB}`;
  const hits: Hit[] = [];
  for (const c of compile(entities)) {
    hits.push(...scan(c, title, tFold, "title"), ...scan(c, body, bFold, "body"));
  }

  // En uzun eşleşme kazanır (aynı alanda çakışan aralıklar)
  hits.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
  const taken: Record<string, [number, number][]> = { title: [], body: [] };
  const kept: Hit[] = [];
  const sharedSpans = new Map<string, Hit[]>();
  for (const h of hits) {
    const spanKey = `${h.field}:${h.start}:${h.end}`;
    const same = sharedSpans.get(spanKey);
    if (same && same[0].via.toLowerCase() === h.via.toLowerCase()) { same.push(h); kept.push(h); continue; }
    if (taken[h.field].some(([s, e]) => h.start < e && s < h.end)) continue;
    taken[h.field].push([h.start, h.end]);
    sharedSpans.set(spanKey, [h]);
    kept.push(h);
  }

  const byEntity = new Map<string, Hit[]>();
  for (const h of kept) {
    const l = byEntity.get(h.entity.id) ?? [];
    l.push(h);
    byEntity.set(h.entity.id, l);
  }

  const out: Mention[] = [];
  for (const [, hs] of byEntity) {
    const e = hs[0].entity;
    const ex = excluded(e, all);
    let valid = hs;
    // Dışlama kelimesi varsa belirsiz adla gelen eşleşmeler düşer
    if (ex) valid = valid.filter((h) => !h.ambiguous);
    const ambiguousOnly = valid.length > 0 && valid.every((h) => h.ambiguous);
    if (ambiguousOnly && !opt.coatingsContext) continue;
    if (!valid.length) continue;
    const ev: string[] = [];
    for (const h of valid.slice(0, 3)) {
      const s = snippetAround(h.text, h.start, h.end - h.start);
      if (!ev.includes(s)) ev.push(s);
    }
    out.push({
      entity_id: e.id, slug: e.slug, count: valid.length,
      in_headline: valid.some((h) => h.field === "title"),
      in_lead: valid.some((h) => h.field === "body" && h.start < 160),
      via: [...new Set(valid.map((h) => h.via))],
      evidence: ev,
      ambiguous_only: ambiguousOnly,
    });
  }

  // Ortak alias (aynı aralığı birden fazla varlık paylaşıyor): ülke bağlamıyla seç, seçilemezse işaretle
  for (const [, group] of sharedSpans) {
    const ids = [...new Set(group.map((h) => h.entity.id))];
    if (ids.length < 2) continue;
    const ms = out.filter((m) => ids.includes(m.entity_id));
    const onlyShared = ms.filter((m) => m.via.length === 1 && m.via[0].toLowerCase() === group[0].via.toLowerCase());
    if (onlyShared.length < 2) continue;
    const byCountry = opt.country ? onlyShared.filter((m) => entities.find((e) => e.id === m.entity_id)?.country_iso2 === opt.country) : [];
    if (byCountry.length === 1) {
      for (const m of onlyShared) if (m !== byCountry[0]) out.splice(out.indexOf(m), 1);
    } else {
      for (const m of onlyShared) m.shared_with = onlyShared.filter((x) => x !== m).map((x) => x.slug);
    }
  }
  return out;
}

/**
 * Ana konu markası. Tek bir geçiş yetmez: başlıkta olmalı, ya da girişte geçip en az 2 kez anılmalı.
 * Başlıkta birden fazla marka varsa ilk geçen seçilir. Ortak alias'lı belirsiz varlık ana konu olamaz.
 */
export function mainSubject(mentions: Mention[], title: string): Mention | null {
  const eligible = mentions.filter((m) => !m.shared_with?.length);
  const inTitle = eligible.filter((m) => m.in_headline);
  if (inTitle.length) {
    const f = fold(title);
    const pos = (m: Mention) => Math.min(...m.via.map((v) => { const i = f.indexOf(fold(v)); return i < 0 ? 1e9 : i; }));
    return inTitle.sort((a, b) => pos(a) - pos(b))[0];
  }
  const strong = eligible.filter((m) => m.count >= 2 && m.in_lead).sort((a, b) => b.count - a.count);
  if (strong.length && (strong.length === 1 || strong[0].count > strong[1].count)) return strong[0];
  return null;
}
