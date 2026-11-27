// brands.json biçimini çalışma zamanı Entity tipine çevirir (testler ve seed SQL üreticisi kullanır).
import type { Alias, Entity } from "./types.ts";

export type SeedAlias = string | { a: string; ambiguous?: boolean; cs?: boolean; lang?: string };
export type SeedEntity = {
  slug: string; name: string; type: Entity["entity_type"]; parent?: string; parent_note?: string; country?: string;
  website?: string; priority?: number; segments?: string[]; products?: string[]; aliases: SeedAlias[];
  exclude?: string[]; languages?: string[]; notes?: string;
};

export function seedAliases(s: SeedEntity): Alias[] {
  return s.aliases.map((a) => typeof a === "string"
    ? { alias: a }
    : { alias: a.a, is_ambiguous: !!a.ambiguous, case_sensitive: !!a.cs, lang: a.lang ?? null });
}

export function entitiesFromSeed(list: SeedEntity[]): Entity[] {
  const ids = new Map(list.map((s) => [s.slug, `seed:${s.slug}`]));
  return list.map((s) => ({
    id: ids.get(s.slug)!,
    slug: s.slug,
    name: s.name,
    entity_type: s.type,
    parent_id: s.parent ? ids.get(s.parent) ?? null : null,
    country_iso2: s.country ?? null,
    segments: s.segments ?? [],
    product_families: s.products ?? [],
    exclusion_keywords: s.exclude ?? [],
    languages: s.languages ?? ["en"],
    priority: s.priority ?? 3,
    is_active: true,
    aliases: seedAliases(s),
  }));
}
