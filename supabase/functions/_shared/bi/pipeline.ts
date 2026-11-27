// Tek makale analizi: alias çözümleme → kaplama bağlamı → segment → konu → ülke → içerik türü → puan → karar.
import type { Entity, Mention, RawArticle, SegmentKey, TopicCode } from "./types.ts";
import { mainSubject, resolveMentions } from "./resolve.ts";
import { classifySegments, classifyTopics, coatingsContext, contentType, detectCountry, regionOf } from "./classify.ts";
import { decide, DEFAULT_PUBLISHING, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, scoreArticle, type Decision, type Publishing, type Reliability, type ScoreResult, type Thresholds, type Weights } from "./score.ts";
import { cleanTitle } from "./dedup.ts";

export type Analysis = {
  relevant: boolean;            // en az bir marka geçişi var mı
  mentions: Mention[];
  main: Mention | null;
  coatings: { present: boolean; evidence: string | null };
  segments: { key: SegmentKey; score: number; evidence: string[] }[];
  topics: TopicCode[];
  topicEvidence: Record<string, string>;
  country: string | null;
  region: string | null;
  content: { type: "news" | "press_release" | "opinion" | "sponsored" | "unknown"; promotional: boolean };
  score: ScoreResult;
  decision: Decision;
  ambiguous: boolean;
};

export type AnalyzeConfig = {
  entities: Entity[];
  reliability?: Reliability;
  official?: boolean;
  duplicate?: boolean;
  weights?: Weights;
  thresholds?: Thresholds;
  publishing?: Publishing;
  now?: number;
};

export function analyze(a: RawArticle, c: AnalyzeConfig): Analysis {
  const title = cleanTitle(a.title, a.publisher);
  const body = a.description ?? "";
  const text = `${title}. ${body}`;
  const coatings = coatingsContext(text);
  const country = detectCountry(text, a.source_country);
  const mentions = resolveMentions(title, body, c.entities, { coatingsContext: coatings.present, country: country.iso2 });
  const main = mainSubject(mentions, title);
  const mainEntity = main ? c.entities.find((e) => e.id === main.entity_id) : null;
  const segments = coatings.present || mentions.length ? classifySegments(text, mainEntity?.segments ?? []) : [];
  const topics = classifyTopics(text, segments.map((s) => s.key), !!main);
  const content = contentType(text, !!c.official);
  const ambiguous = mentions.some((m) => m.ambiguous_only || (m.shared_with?.length ?? 0) > 0);
  const score = scoreArticle({
    main, mentions, coatings: coatings.present, segmentScore: segments[0]?.score ?? 0,
    reliability: c.reliability ?? "unknown", official: !!c.official, publishedAt: a.published_at, duplicate: !!c.duplicate, now: c.now,
  }, c.weights ?? DEFAULT_WEIGHTS, c.thresholds ?? DEFAULT_THRESHOLDS);
  const decision = mentions.length
    ? decide(score, { ambiguous, promotional: content.promotional }, c.publishing ?? DEFAULT_PUBLISHING)
    : { status: "rejected" as const, reason: "izlenen marka geçmiyor" };
  return {
    relevant: mentions.length > 0, mentions, main, coatings, segments, topics: topics.codes, topicEvidence: topics.evidence,
    country: country.iso2, region: regionOf(country.iso2), content, score, decision, ambiguous,
  };
}
