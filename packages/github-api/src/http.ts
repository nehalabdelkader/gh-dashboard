/**
 * The single request path every endpoint goes through.
 *
 * Everything cross-cutting lives here rather than in the endpoint functions: quota
 * headers, status -> typed error mapping, and abort handling. An endpoint is then just a
 * URL plus a mapper.
 *
 * Deferred: conditional requests (`If-None-Match` / `304` replay). See plan §6 — every
 * refresh currently costs quota, which caps an unauthenticated client at ~2 full
 * refreshes per hour.
 */
import {
  AbortError,
  AuthError,
  GitHubError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
} from './errors.js';
import { isRateLimited, parseRateLimitHeaders, rateLimitResourceOf } from './rate-limit.js';
import type { RateLimitInfo } from './types/domain.js';

export const DEFAULT_BASE_URL = 'https://api.github.com';
const API_VERSION = '2022-11-28';

/** What a call returns alongside its payload, so the store can react to quota and caching. */
export interface ResponseMeta {
  status: number;
  url: string;
  rateLimit: RateLimitInfo | undefined;
  /** Which quota bucket this was billed to: `core`, `search`, ... */
  rateLimitResource: string | undefined;
}

export interface GhResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface RequestOptions {
  signal?: AbortSignal | undefined;
}

export interface HttpClientConfig {
  baseUrl: string;
  fetch: typeof globalThis.fetch;
  userAgent: string | undefined;
}

export interface RequestSpec {
  path: string;
  query?: Record<string, string | number | undefined> | undefined;
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query: Record<string, string | number | undefined> | undefined,
): string {
  const url = new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function buildHeaders(config: HttpClientConfig): Headers {
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
  });
  if (config.userAgent) headers.set('User-Agent', config.userAgent);
  return headers;
}

/** GitHub's error bodies are `{ message, documentation_url }`, but only usually. */
async function readErrorBody(
  response: Response,
): Promise<{ message: string | undefined; documentationUrl: string | undefined }> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      return {
        message: typeof record['message'] === 'string' ? record['message'] : undefined,
        documentationUrl:
          typeof record['documentation_url'] === 'string' ? record['documentation_url'] : undefined,
      };
    }
  } catch {
    // Non-JSON error body (an HTML gateway page, say). Fall through to the status text.
  }
  return { message: undefined, documentationUrl: undefined };
}

async function toTypedError(response: Response, url: string): Promise<GitHubError> {
  const { message, documentationUrl } = await readErrorBody(response);
  const init = {
    status: response.status,
    url,
    documentationUrl,
  };
  const text = message ?? response.statusText ?? `Request failed with ${response.status}`;

  if (isRateLimited(response.status, response.headers)) {
    const rateLimit = parseRateLimitHeaders(response.headers);
    return new RateLimitError(text, {
      ...init,
      rateLimit,
      resetAt: rateLimit?.resetAt,
    });
  }

  switch (response.status) {
    case 401:
      return new AuthError(text, init);
    // A 403 that is not a rate limit is a permissions problem, not a quota one.
    case 403:
      return new AuthError(text, init);
    case 404:
      return new NotFoundError(text, init);
    case 422:
      return new ValidationError(text, init);
    default:
      if (response.status >= 500) return new ServerError(text, init);
      return new GitHubError(text, init);
  }
}

function isAbort(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (error as { name?: unknown }).name === 'AbortError';
}

/** Performs one GET. */
export async function request<T>(
  config: HttpClientConfig,
  spec: RequestSpec,
  options: RequestOptions = {},
): Promise<GhResponse<T>> {
  const url = buildUrl(config.baseUrl, spec.path, spec.query);

  let response: Response;
  try {
    response = await config.fetch(url, {
      method: 'GET',
      headers: buildHeaders(config),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (isAbort(error)) throw new AbortError('Request aborted', { url, cause: error });
    throw new NetworkError(error instanceof Error ? error.message : 'Network request failed', {
      url,
      cause: error,
    });
  }

  const meta: ResponseMeta = {
    status: response.status,
    url,
    rateLimit: parseRateLimitHeaders(response.headers),
    rateLimitResource: rateLimitResourceOf(response.headers),
  };

  if (!response.ok) throw await toTypedError(response, url);

  return { data: (await response.json()) as T, meta };
}
