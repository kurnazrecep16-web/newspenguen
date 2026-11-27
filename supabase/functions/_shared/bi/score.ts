// Şeffaf puanlama. Her alt puanın hangi faktörden geldiği score_breakdown'da saklanır.
import type { Mention } from "./types.ts";

export type Thresholds = { very_high: number; high: number; medium: number };
export type Weights = { brand: number; segment: number; source: number; freshness: number };
export type Publishing = { auto_publish: boolean; auto_publish_min: number; review_below: number; reject_below: number };

export const DEFAULT_THRESHOLDS: Thresholds = { very_high: 90, high: 75, medium: 50 };
export const DEFAULT_WEIGHTS: Weights = { brand: 0.4, segment: 0.25, source: 0.2, freshness: 0.15 };
export const DEFAULT_PUBLISHING: Publishing = { auto_publish: false, auto_publish_min: 90, review_below: 75, reject_below: 25 };

export type Reliability = "high" | "medium" | "low" | "unreliable" | "unknown";

export function brandScore(main: Mention | null, all: Mention[]): { score: number; factors: Record<string, number> } {
  const m = main ?? [...all].sort((a, b) => b.count - a.count)[0];
  if (!m) return { score: 0, factors: {} };
  const f: Record<string, number> = {};
  if (m.in_headline) f.headline = 40;
  if (m.in_lead) f.lead = 15;
  if (m.count >= 2) f.repeated = Math.min(15, 5 * (m.count - 1));
  if (main && main.entity_id === m.entity_id) f.main_subject = 25;
  if (!m.in_headline && !m.in_lead) f.body_only = 10;
  if (m.ambiguous_only) f.ambiguous_alias = -20;
  if (m.shared_with?.length) f.shared_alias = -25;
  const score = Math.max(0, Math.min(100, Object.values(f).reduce((a, b) => a + b, 0)));
  return { score, factors: f };
}

export function sourceConfidence(rel: Reliability, official: boolean): number {
  if (official) return 90;            // resmi kaynak: doğruluk yüksek, ama tanıtım amaçlı olarak işaretlenir
  return { high: 90, medium: 70, low: 40, unreliable: 10, unknown: 55 }[rel];
}

/** Tazelik: 0–24 saat 100, 7 günde ~50, 30 günde ~10. */
export function freshness(publishedAt: string | null | undefined, now = Date.now()): number {
  if (!publishedAt) return 40;
  const h = (now - Date.parse(publishedAt)) / 36e5;
  if (isNaN(h)) return 40;
  if (h <= 24) return 100;
  return Math.max(5, Math.round(100 * Math.exp(-(h - 24) / 210)));
}

export type ScoreInput = {
  main: Mention | null;
  mentions: Mention[];
  coatings: boolean;
  segmentScore: number;      // en iyi segment puanı (0 ise segment bulunamadı)
  reliability: Reliability;
  official: boolean;
  publishedAt?: string | null;
  duplicate: boolean;
  now?: number;
};

export type ScoreResult = {
  brand: number; segment: number; source: number; freshness: number; overall: number;
  band: "very_high" | "high" | "medium" | "low";
  breakdown: Record<string, unknown>;
};

export function scoreArticle(i: ScoreInput, w: Weights = DEFAULT_WEIGHTS, t: Thresholds = DEFAULT_THRESHOLDS): ScoreResult {
  const b = brandScore(i.main, i.mentions);
  const src = sourceConfidence(i.reliability, i.official);
  const fr = freshness(i.publishedAt, i.now);
  const seg = i.segmentScore;
  let overall = w.brand * b.score + w.segment * seg + w.source * src + w.freshness * fr;
  const caps: string[] = [];
  // Kaplama bağlamı yoksa bu bir kaplama haberi değildir: en fazla "düşük"
  if (!i.coatings) { overall = Math.min(overall, t.medium - 1); caps.push("no_coatings_context"); }
  if (!i.main) { overall = Math.min(overall, t.high - 1); caps.push("no_main_subject"); }
  if (i.duplicate) caps.push("duplicate_merged");
  const o = Math.round(Math.max(0, Math.min(100, overall)));
  return {
    brand: b.score, segment: seg, source: src, freshness: fr, overall: o, band: band(o, t),
    breakdown: { weights: w, brand_factors: b.factors, reliability: i.reliability, official: i.official, caps },
  };
}

export function band(score: number, t: Thresholds = DEFAULT_THRESHOLDS): ScoreResult["band"] {
  return score >= t.very_high ? "very_high" : score >= t.high ? "high" : score >= t.medium ? "medium" : "low";
}

export type Decision = { status: "discovered" | "under_review" | "approved" | "rejected"; reason: string };

/**
 * Editoryal politika. Otomatik yayın yalnızca yönetici açıkça açtıysa ve puan eşiği geçildiyse
 * "approved" (yayın kuyruğu) verir; asla doğrudan "published" vermez.
 */
export function decide(s: ScoreResult, flags: { ambiguous: boolean; promotional: boolean }, p: Publishing = DEFAULT_PUBLISHING): Decision {
  if (s.overall < p.reject_below) return { status: "rejected", reason: `puan ${s.overall} < ${p.reject_below}` };
  if (flags.ambiguous) return { status: "under_review", reason: "belirsiz marka eşleşmesi" };
  if (s.overall < p.review_below) return { status: "under_review", reason: `puan ${s.overall} < ${p.review_below}` };
  if (p.auto_publish && s.overall >= p.auto_publish_min && !flags.promotional) return { status: "approved", reason: "otomatik yayın politikası" };
  return { status: "discovered", reason: "editör onayı bekliyor" };
}
