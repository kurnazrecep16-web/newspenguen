// supabase/seed/brands.json → supabase/seed/brands.sql
// Kullanım: node scripts/bi-seed-sql.mjs
// Üretilen SQL idempotenttir (slug / alias_norm / lang+term üzerinden "on conflict do nothing").
import { readFileSync, writeFileSync } from "node:fs";
import { norm } from "../supabase/functions/_shared/bi/text.ts";

const root = new URL("..", import.meta.url);
const seed = JSON.parse(readFileSync(new URL("supabase/seed/brands.json", root), "utf8"));
const lit = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a && a.length ? `array[${a.map(lit).join(", ")}]::text[]` : "'{}'::text[]");

const out = ["-- OTOMATİK ÜRETİLDİ: node scripts/bi-seed-sql.mjs (kaynak: supabase/seed/brands.json)", "begin;"];
for (const e of seed.entities) {
  out.push(`insert into bi_entities (slug, name, entity_type, parent_note, country_iso2, website, segments, product_families, exclusion_keywords, languages, priority, notes)
values (${lit(e.slug)}, ${lit(e.name)}, ${lit(e.type)}, ${lit(e.parent_note)}, ${lit(e.country)}, ${lit(e.website)}, ${arr(e.segments)}, ${arr(e.products)}, ${arr(e.exclude)}, ${arr(e.languages ?? ["en"])}, ${e.priority ?? 3}, ${lit(e.notes)})
on conflict (slug) do nothing;`);
}
for (const e of seed.entities.filter((x) => x.parent)) {
  out.push(`update bi_entities c set parent_id = p.id from bi_entities p where c.slug = ${lit(e.slug)} and p.slug = ${lit(e.parent)} and c.parent_id is null;`);
}
for (const e of seed.entities) {
  for (const a of e.aliases) {
    const o = typeof a === "string" ? { a } : a;
    out.push(`insert into bi_entity_aliases (entity_id, alias, alias_norm, lang, is_ambiguous, case_sensitive)
select id, ${lit(o.a)}, ${lit(norm(o.a))}, ${lit(o.lang ?? null)}, ${!!o.ambiguous}, ${!!o.cs} from bi_entities where slug = ${lit(e.slug)}
on conflict (entity_id, alias_norm) do nothing;`);
  }
}
for (const [lang, t] of Object.entries(seed.query_terms)) {
  for (const kind of ["context", "business"]) for (const term of t[kind] ?? []) {
    out.push(`insert into bi_query_terms (lang, term, kind) values (${lit(lang)}, ${lit(term)}, ${lit(kind)}) on conflict (lang, term) do nothing;`);
  }
}
out.push("commit;", "");
writeFileSync(new URL("supabase/seed/brands.sql", root), out.join("\n"));
console.log(`brands.sql: ${seed.entities.length} varlık yazıldı`);
