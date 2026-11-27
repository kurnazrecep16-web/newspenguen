// Ortak tipler

export type SegmentKey = "marine" | "protective" | "powder" | "decorative" | "energy";
export const SEGMENTS: SegmentKey[] = ["marine", "protective", "powder", "decorative", "energy"];

export type TopicCode = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O";

export type Alias = {
  alias: string;
  is_ambiguous?: boolean;
  case_sensitive?: boolean;
  lang?: string | null;
  use_in_search?: boolean;
};

export type Entity = {
  id: string;
  slug: string;
  name: string;
  entity_type: "manufacturer" | "corporate_group" | "consumer_brand" | "product_brand";
  parent_id?: string | null;
  country_iso2?: string | null;
  segments: string[];
  product_families: string[];
  exclusion_keywords: string[];
  search_keywords?: string[];
  languages: string[];
  priority: number;
  is_active?: boolean;
  aliases: Alias[];
};

/** Sağlayıcıdan bağımsız, normalize edilmiş aday makale. */
export type RawArticle = {
  provider: string;
  external_id?: string | null;
  url: string;
  title: string;
  description?: string | null;
  /** Sağlayıcı kısa açıklama verip saklamaya izin veriyorsa "snippet", aksi halde "link_only". */
  storage_right: "link_only" | "snippet";
  publisher?: string | null;
  language?: string | null;      // ISO 639-1
  source_country?: string | null; // sağlayıcının verdiği ülke (ad veya ISO2)
  published_at?: string | null;  // ISO 8601
  query?: string;
};

export type Mention = {
  entity_id: string;
  slug: string;
  count: number;
  in_headline: boolean;
  in_lead: boolean;
  via: string[];          // eşleşen alias / ürün adları
  evidence: string[];     // metinden birebir alıntı
  ambiguous_only: boolean;
  shared_with?: string[]; // aynı alias'ı paylaşan diğer varlıklar (ör. Dulux)
};
