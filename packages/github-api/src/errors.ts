/**
 * Typed error hierarchy.
 *
 * The UI has to say different things for "that repo does not exist", "you are out of
 * quota until 14:32" and "the network dropped" — so those are three types, not three
 * string comparisons on a generic failure. The data layer's retry policy reads the same
 * types: retrying a 404 or a rate-limit error only burns what is left of the quota.
 */
import type { RateLimitInfo } from './types/domain.js';

export interface GitHubErrorInit {
  status?: number | undefined;
  url?: string | undefined;
  /** GitHub's `documentation_url` from the error body, when it sent one. */
  documentationUrl?: string | undefined;
  /** The underlying error this wraps — a `fetch` rejection, say. */
  cause?: unknown;
}

export class GitHubError extends Error {
  override readonly name: string = 'GitHubError';
  readonly status: number | undefined;
  readonly url: string | undefined;
  readonly documentationUrl: string | undefined;

  constructor(message: string, init: GitHubErrorInit = {}) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause });
    this.status = init.status;
    this.url = init.url;
    this.documentationUrl = init.documentationUrl;
  }
}

/** 404, or a 403 on a repo that exists but is not publicly visible. */
export class NotFoundError extends GitHubError {
  override readonly name = 'NotFoundError';

  constructor(message = 'Resource not found', init: GitHubErrorInit = {}) {
    super(message, { ...init, status: init.status ?? 404 });
  }
}

/**
 * 403/429 with `x-ratelimit-remaining: 0`.
 *
 * Carries `resetAt` so the UI can render "resets in 12m" instead of "something went wrong",
 * and so "Refresh all" can disable itself rather than fire 30 doomed requests.
 */
export class RateLimitError extends GitHubError {
  override readonly name = 'RateLimitError';
  readonly resetAt: string | undefined;
  readonly rateLimit: RateLimitInfo | undefined;

  constructor(
    message = 'GitHub API rate limit exceeded',
    init: GitHubErrorInit & {
      resetAt?: string | undefined;
      rateLimit?: RateLimitInfo | undefined;
    } = {},
  ) {
    super(message, init);
    this.resetAt = init.resetAt ?? init.rateLimit?.resetAt;
    this.rateLimit = init.rateLimit;
  }

  /** Milliseconds until the bucket refills; `0` once it has. */
  msUntilReset(now: number = Date.now()): number {
    if (!this.resetAt) return 0;
    return Math.max(0, new Date(this.resetAt).getTime() - now);
  }
}

/**
 * 401, or a 403 that is not a rate limit.
 *
 * Unauthenticated, this is GitHub's secondary rate limit (abuse detection) or a private
 * resource — not a credentials problem, since no credentials are sent.
 */
export class AuthError extends GitHubError {
  override readonly name = 'AuthError';

  constructor(message = 'Authentication failed', init: GitHubErrorInit = {}) {
    super(message, { ...init, status: init.status ?? 401 });
  }
}

/** 422 — most often a malformed search query. */
export class ValidationError extends GitHubError {
  override readonly name = 'ValidationError';

  constructor(message = 'Request was rejected as invalid', init: GitHubErrorInit = {}) {
    super(message, { ...init, status: init.status ?? 422 });
  }
}

/** 5xx. Retryable, unlike everything above it. */
export class ServerError extends GitHubError {
  override readonly name = 'ServerError';
}

/** `fetch` itself rejected: offline, DNS, CORS, TLS. No status to report. */
export class NetworkError extends GitHubError {
  override readonly name = 'NetworkError';

  constructor(message = 'Network request failed', init: GitHubErrorInit = {}) {
    super(message, init);
  }
}

/** The caller's `AbortSignal` fired. Not a failure — callers usually swallow it. */
export class AbortError extends GitHubError {
  override readonly name = 'AbortError';

  constructor(message = 'Request aborted', init: GitHubErrorInit = {}) {
    super(message, init);
  }
}

export function isGitHubError(error: unknown): error is GitHubError {
  return error instanceof GitHubError;
}

/** True for the errors where a retry has a chance of succeeding. */
export function isRetryable(error: unknown): boolean {
  if (error instanceof AbortError) return false;
  if (error instanceof NetworkError) return true;
  if (error instanceof ServerError) return true;
  return false;
}
