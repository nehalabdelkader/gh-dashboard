/**
 * Rate-limit header parsing.
 *
 * Every response carries the caller's remaining quota, so the header chip never needs a
 * dedicated request — `GET /rate_limit` is only a cold-start and a poll.
 */
import type { RateLimitInfo, RateLimitSnapshot } from './types/domain.js';
import type { GhRateLimitOverview } from './types/dto.js';

function toInt(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Unix seconds -> ISO-8601. */
function resetToIso(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toISOString();
}

/** Reads `x-ratelimit-*` off a response. `undefined` when GitHub sent no quota headers. */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const limit = toInt(headers.get('x-ratelimit-limit'));
  const remaining = toInt(headers.get('x-ratelimit-remaining'));
  const reset = toInt(headers.get('x-ratelimit-reset'));
  if (limit === undefined || remaining === undefined || reset === undefined) return undefined;

  return {
    limit,
    remaining,
    used: toInt(headers.get('x-ratelimit-used')) ?? limit - remaining,
    resetAt: resetToIso(reset),
  };
}

/** Which bucket a response was billed to — `search` and `core` have separate quotas. */
export function rateLimitResourceOf(headers: Headers): string | undefined {
  return headers.get('x-ratelimit-resource') ?? undefined;
}

/**
 * A 403/429 is only a rate limit when the quota is actually spent; otherwise it is an
 * auth or abuse-detection failure, which needs different UI and a different retry policy.
 */
export function isRateLimited(status: number, headers: Headers): boolean {
  if (status !== 403 && status !== 429) return false;
  if (headers.get('retry-after') !== null) return true;
  return toInt(headers.get('x-ratelimit-remaining')) === 0;
}

/** Seconds from a `Retry-After` header, which may be a delta or an HTTP date. */
export function parseRetryAfter(headers: Headers, now: number = Date.now()): number | undefined {
  const raw = headers.get('retry-after');
  if (raw === null) return undefined;

  const seconds = Number.parseInt(raw, 10);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);

  const date = Date.parse(raw);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.round((date - now) / 1000));
}

function toRateLimitInfo(
  bucket: { limit: number; remaining: number; reset: number; used: number } | undefined,
): RateLimitInfo | undefined {
  if (!bucket) return undefined;
  return {
    limit: bucket.limit,
    remaining: bucket.remaining,
    used: bucket.used,
    resetAt: resetToIso(bucket.reset),
  };
}

export function toRateLimitSnapshot(dto: GhRateLimitOverview): RateLimitSnapshot {
  return {
    core: toRateLimitInfo(dto.resources.core),
    search: toRateLimitInfo(dto.resources.search),
  };
}
