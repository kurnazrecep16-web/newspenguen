// Yeniden deneme, üstel bekleme ve hız sınırı yönetimi

export class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(msg: string, retryAfterMs: number) { super(msg); this.name = "RateLimitError"; this.retryAfterMs = retryAfterMs; }
}
export class ProviderError extends Error {
  status: number;
  constructor(msg: string, status: number) { super(msg); this.name = "ProviderError"; this.status = status; }
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type RetryOptions = { retries?: number; baseMs?: number; timeoutMs?: number; sleep?: (ms: number) => Promise<void>; fetch?: FetchLike };

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function parseRetryAfter(h: string | null): number | null {
  if (!h) return null;
  const s = Number(h);
  if (!isNaN(s)) return s * 1000;
  const d = Date.parse(h);
  return isNaN(d) ? null : Math.max(0, d - Date.now());
}

/**
 * 5xx ve ağ hatalarında üstel bekleme ile yeniden dener (1s, 2s, 4s …).
 * 429'da yeniden denemez; RateLimitError fırlatır ki işçi sağlayıcıyı bu tur için durdursun.
 * Diğer 4xx: ProviderError (yeniden denenmez).
 */
export async function fetchWithRetry(url: string, init: RequestInit = {}, o: RetryOptions = {}): Promise<Response> {
  const retries = o.retries ?? 3, base = o.baseMs ?? 1000, sleep = o.sleep ?? realSleep, f = o.fetch ?? fetch;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await f(url, { ...init, signal: AbortSignal.timeout(o.timeoutMs ?? 20000) });
      if (r.status === 429) throw new RateLimitError(`HTTP 429`, parseRetryAfter(r.headers.get("retry-after")) ?? 15 * 60_000);
      if (r.status >= 500) { lastErr = new ProviderError(`HTTP ${r.status}`, r.status); }
      else if (r.status >= 400 && r.status !== 304) throw new ProviderError(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`, r.status);
      else return r;
    } catch (e) {
      if (e instanceof RateLimitError || e instanceof ProviderError) throw e;
      lastErr = e;
    }
    if (attempt < retries) await sleep(base * 2 ** attempt);
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
