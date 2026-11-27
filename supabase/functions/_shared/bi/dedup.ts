// Tekrar ve sendikasyon tespiti: kanonik URL, başlık benzerliği, simhash, zaman yakınlığı.
import { norm, tokens } from "./text.ts";

const TRACKING = /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ocid$|cmpid$|ref$|ref_src$|src$|igshid$|spm$|share$|amp$|output$)/i;

export function canonicalUrl(raw: string): string {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return raw.trim(); }
  u.protocol = "https:";
  u.hash = "";
  u.hostname = u.hostname.toLowerCase().replace(/^(www|m|amp|mobile)\./, "");
  for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
  u.searchParams.sort();
  let path = u.pathname.replace(/\/(amp|amp\.html)\/?$/i, "/").replace(/\/index\.html?$/i, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  u.pathname = path;
  const q = u.searchParams.toString();
  return `https://${u.hostname}${u.pathname}${q ? "?" + q : ""}`;
}

export function domainOf(raw: string): string {
  try { return new URL(raw).hostname.toLowerCase().replace(/^(www|m|amp|mobile)\./, ""); } catch { return ""; }
}

const STOP = new Set(("the a an and or of to in on for with by at from as is are was be new its it this that " +
  "ve ile bir bu da de için olarak yeni den dan der die das und mit von für le la les et des du pour en el los las y del con il di e per").split(" "));

/** Yayıncı son ekini at: "Başlık - Reuters", "Başlık | Dünya". */
export function cleanTitle(t: string, publisher?: string | null): string {
  const m = /\s+([-–|·])\s+([^-–|·]{2,40})$/u.exec(t);
  if (!m) return t.trim();
  const suf = norm(m[2]), pub = norm(publisher ?? "");
  const looksLikePublisher = m[1] === "|" || /\.(com|net|org|tr|de|co|uk|biz)\b/i.test(m[2]) ||
    (pub && (suf.includes(pub) || pub.includes(suf) || suf.replace(/ /g, "") === pub.replace(/ /g, "")));
  return looksLikePublisher ? t.slice(0, m.index).trim() : t.trim();
}

export function titleKey(t: string): string {
  return norm(cleanTitle(t));
}

export function shingles(t: string): Set<string> {
  const w = tokens(cleanTitle(t)).filter((x) => !STOP.has(x));
  const out = new Set<string>();
  for (const x of w) out.add(x.length > 6 ? x.slice(0, 6) : x);   // kaba kök: çekim eklerini tolere eder
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let c = 0;
  for (const x of a) if (b.has(x)) c++;
  return c / (a.size + b.size - c);
}

/** Küçük kümeye göre örtüşme (biri diğerinin kısaltılmışı ise yüksek çıkar). */
export function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let c = 0;
  for (const x of a) if (b.has(x)) c++;
  return c / Math.min(a.size, b.size);
}

// 64-bit FNV-1a
function fnv64(s: string): bigint {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h;
}

/** Metin simhash'i (işaretli 64-bit, Postgres bigint ile uyumlu). */
export function simhash(text: string): bigint {
  const w = tokens(text).filter((x) => !STOP.has(x));
  if (!w.length) return 0n;
  const feats: string[] = [];
  for (let i = 0; i < w.length; i++) feats.push(i + 1 < w.length ? w[i] + " " + w[i + 1] : w[i]);
  const v = new Array<number>(64).fill(0);
  for (const f of feats) {
    const h = fnv64(f);
    for (let i = 0; i < 64; i++) v[i] += (h >> BigInt(i)) & 1n ? 1 : -1;
  }
  let out = 0n;
  for (let i = 0; i < 64; i++) if (v[i] > 0) out |= 1n << BigInt(i);
  return BigInt.asIntN(64, out);
}

export function hamming(a: bigint, b: bigint): number {
  let x = BigInt.asUintN(64, a ^ b), c = 0;
  while (x) { x &= x - 1n; c++; }
  return c;
}

export type DedupCandidate = {
  canonical_url: string;
  title: string;
  description?: string | null;
  published_at?: string | null;
};

export type DedupExisting = DedupCandidate & { story_id: string; simhash?: bigint | null };

export type DedupResult =
  | { kind: "same_url"; story_id: string }
  | { kind: "same_story"; story_id: string; similarity: number; reason: string }
  | { kind: "new" };

const DAY = 864e5;

/**
 * Aday makaleyi mevcut makalelerle karşılaştırır.
 * Aynı olay: başlık benzerliği yüksek VE yayın tarihleri 4 gün içinde;
 * ya da açıklama simhash'i çok yakın (aynı basın bülteni farklı sitelerde).
 */
export function findDuplicate(c: DedupCandidate, existing: DedupExisting[], windowDays = 4): DedupResult {
  for (const e of existing) if (e.canonical_url === c.canonical_url) return { kind: "same_url", story_id: e.story_id };
  const cs = shingles(c.title);
  const ct = c.published_at ? Date.parse(c.published_at) : NaN;
  const cHash = (c.description ?? "").length > 60 ? simhash(c.description!) : null;   // basın bülteni gövdesi
  let best: { story_id: string; similarity: number; reason: string } | null = null;
  for (const e of existing) {
    const et = e.published_at ? Date.parse(e.published_at) : NaN;
    if (!isNaN(ct) && !isNaN(et) && Math.abs(ct - et) > windowDays * DAY) continue;
    const es = shingles(e.title);
    const j = jaccard(cs, es), o = overlap(cs, es);
    let sim = 0, reason = "";
    if (titleKey(c.title) === titleKey(e.title) && titleKey(c.title).length > 12) { sim = 1; reason = "aynı başlık"; }
    else if (j >= 0.6 || (o >= 0.8 && Math.min(cs.size, es.size) >= 4)) { sim = Math.max(j, o * 0.9); reason = "benzer başlık"; }
    if (cHash !== null && (e.description ?? "").length > 60) {
      const eh = e.simhash ?? simhash(e.description!);
      const d = hamming(cHash, eh);
      if (d <= 6) { const s = 1 - d / 64; if (s > sim) { sim = s; reason = "aynı basın bülteni / sendikasyon"; } }
    }
    if (sim > 0 && (!best || sim > best.similarity)) best = { story_id: e.story_id, similarity: +sim.toFixed(3), reason };
  }
  return best ? { kind: "same_story", ...best } : { kind: "new" };
}
