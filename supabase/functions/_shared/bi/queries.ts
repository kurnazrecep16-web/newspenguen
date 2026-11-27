// Marka alias'larından ve dil başına bağlam terimlerinden dinamik arama sorguları üretir.
// Sorgu "spec"i sağlayıcıdan bağımsızdır; her adaptör kendi sözdizimine çevirir.
import type { Entity } from "./types.ts";

const CJK = /[\u3040-\u30ff\u3400-\u9fff]/;

export type TermSet = { context: string[]; business: string[] };
export type QuerySpec = {
  id: string;                 // kararlı kimlik (rotasyon imleci için)
  lang: string;
  family: "context" | "business";
  aliases: string[];          // tırnak içinde aranacak tam ifadeler
  terms: string[];            // en az biri geçmeli (OR)
  entity_slugs: string[];
};

/**
 * Aynı dildeki markaları gruplar halinde birleştirir (sağlayıcı istek kotasını korumak için).
 * Belirsiz alias'lar (PPG, Marshall, DAW…) tek başına aranmaz; yalnızca belirsiz olmayan alias'lar kullanılır.
 */
export function buildQuerySpecs(entities: Entity[], terms: Record<string, TermSet>, opt: { groupSize?: number; maxAliasesPerEntity?: number; families?: ("context" | "business")[] } = {}): QuerySpec[] {
  const groupSize = opt.groupSize ?? 6, maxA = opt.maxAliasesPerEntity ?? 2;
  const fams = opt.families ?? ["context", "business"];
  const active = entities.filter((e) => e.is_active !== false).sort((a, b) => a.priority - b.priority || a.slug.localeCompare(b.slug));
  const specs: QuerySpec[] = [];
  for (const lang of Object.keys(terms)) {
    const items: { slug: string; aliases: string[] }[] = [];
    for (const e of active) {
      if (!e.languages.includes(lang)) continue;
      const as = e.aliases
        .filter((a) => !a.is_ambiguous && a.use_in_search !== false && (!a.lang || a.lang === lang))
        .map((a) => a.alias)
        .filter((a) => lang === "zh" || !CJK.test(a))   // Çince/Japonca adlar yalnızca zh sorgusunda
        .sort((a, b) => (lang === "zh" ? Number(CJK.test(b)) - Number(CJK.test(a)) : 0))
        .filter((a, _i, all) => !all.some((b) => b !== a && b.length < a.length && a.toLowerCase().includes(b.toLowerCase())))  // "Jotun" varken "Jotun Paints" gereksiz
        .slice(0, maxA);
      if (as.length) items.push({ slug: e.slug, aliases: as });
    }
    for (let i = 0; i < items.length; i += groupSize) {
      const g = items.slice(i, i + groupSize);
      for (const family of fams) {
        const t = terms[lang][family];
        if (!t?.length) continue;
        specs.push({
          id: `${lang}:${family}:${g.map((x) => x.slug).join(",")}`,
          lang, family,
          aliases: g.flatMap((x) => x.aliases),
          terms: t,
          entity_slugs: g.map((x) => x.slug),
        });
      }
    }
  }
  return specs;
}

/** Rotasyon: her turda imleçten başlayarak n sorgu seçer; "context" ailesi önceliklidir. */
export function pickSlice(specs: QuerySpec[], cursor: number, n: number): { slice: QuerySpec[]; next: number } {
  if (!specs.length) return { slice: [], next: 0 };
  const ordered = [...specs.filter((s) => s.family === "context"), ...specs.filter((s) => s.family === "business")];
  const slice: QuerySpec[] = [];
  for (let i = 0; i < Math.min(n, ordered.length); i++) slice.push(ordered[(cursor + i) % ordered.length]);
  return { slice, next: (cursor + slice.length) % ordered.length };
}

const q = (s: string) => `"${s.replace(/"/g, "")}"`;

/** GDELT DOC: OR blokları iç içe olamaz; iki ayrı OR bloğu boşlukla (AND) birleşir. */
export function gdeltQuery(s: QuerySpec, gdeltLang?: string | null): string {
  const a = s.aliases.length > 1 ? `(${s.aliases.map(q).join(" OR ")})` : q(s.aliases[0]);
  const t = s.terms.length > 1 ? `(${s.terms.map((x) => (/\s/.test(x) ? q(x) : x)).join(" OR ")})` : s.terms[0];
  return `${a} ${t}${gdeltLang ? ` sourcelang:${gdeltLang}` : ""}`;
}

/** TheNewsAPI: + AND, | OR, tırnak tam ifade. */
export function theNewsApiQuery(s: QuerySpec): string {
  return `(${s.aliases.map(q).join(" | ")}) + (${s.terms.map((x) => (/\s/.test(x) ? q(x) : x)).join(" | ")})`;
}

/** NewsAPI: AND / OR / NOT, en çok 500 karakter. */
export function newsApiQuery(s: QuerySpec): string {
  const out = `(${s.aliases.map(q).join(" OR ")}) AND (${s.terms.map((x) => (/\s/.test(x) ? q(x) : x)).join(" OR ")})`;
  if (out.length > 500) throw new Error(`NewsAPI sorgusu 500 karakteri aşıyor (${out.length})`);
  return out;
}

/** Bing News: OR ve parantez desteklenir; iki blok boşlukla (AND) birleşir. */
export function bingQuery(s: QuerySpec): string {
  return `(${s.aliases.map(q).join(" OR ")}) (${s.terms.map((x) => (/\s/.test(x) ? q(x) : x)).join(" OR ")})`;
}
