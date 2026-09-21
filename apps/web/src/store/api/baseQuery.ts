/**
 * The one place `@gh/github-api` meets Redux.
 *
 * A custom `baseQuery` rather than per-endpoint `queryFn`s, because three behaviours are
 * cross-cutting and belong in exactly one place:
 *
 *  1. every response's quota headers go to the meta slice, so the header chip is free —
 *     no extra request just to learn the remaining quota;
 *  2. thrown client errors become serializable `ApiError`s (see `./errors.ts`);
 *  3. non-retryable failures bail out of the `retry` wrapper instead of burning the last
 *     of a 60/hr budget on a 404 that will still be a 404.
 *
 * Deferred: the ETag store (plan §6). It lands in `@gh/github-api`, not here — this file
 * would not change.
 */
import { retry, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import {
  createGitHubClient,
  type CommitSummary,
  type Contributor,
  type GitHubClient,
  type LanguageSlice,
  type RateLimitSnapshot,
  type RepoDetail,
  type RepoRef,
  type RequestOptions,
  type ResponseMeta,
  type SearchReposParams,
  type SearchResult,
} from '@gh/github-api';
import { rateLimitObserved, rateLimitSnapshotReceived } from '../meta/rateLimitSlice.js';
import { toApiError, type ApiError } from './errors.js';

/**
 * A request as a value, not a call.
 *
 * Endpoints describe what they want and the baseQuery performs it, which is what keeps the
 * quota/error handling above in one place instead of repeated in every `queryFn`.
 */
export type GhRequest =
  | { type: 'searchRepos'; params: SearchReposParams }
  | { type: 'getRepo'; ref: RepoRef }
  | { type: 'getLastCommit'; ref: RepoRef & { sha?: string | undefined } }
  | { type: 'getLanguages'; ref: RepoRef }
  | { type: 'getContributors'; ref: RepoRef & { limit?: number | undefined } }
  | { type: 'getRateLimit' };

export type GhResult =
  | SearchResult
  | RepoDetail
  /** `null`, not `undefined`: an empty repo has no last commit, and RTKQ stores `null`. */
  | CommitSummary
  | null
  | LanguageSlice[]
  | Contributor[]
  | RateLimitSnapshot;

const MAX_RETRIES = 2;

async function perform(
  client: GitHubClient,
  request: GhRequest,
  options: RequestOptions,
): Promise<{ data: GhResult; meta: ResponseMeta }> {
  switch (request.type) {
    case 'searchRepos':
      return client.searchRepositories(request.params, options);
    case 'getRepo':
      return client.getRepository(request.ref, options);
    case 'getLastCommit': {
      const response = await client.getLastCommit(request.ref, options);
      return { data: response.data ?? null, meta: response.meta };
    }
    case 'getLanguages':
      return client.getLanguages(request.ref, options);
    case 'getContributors':
      return client.getContributors(request.ref, options);
    case 'getRateLimit':
      return client.getRateLimit(options);
  }
}

/** The baseQuery's full signature, named once so the `retry` cast below stays readable. */
export type GhBaseQuery = BaseQueryFn<GhRequest, GhResult, ApiError, object, ResponseMeta>;

export interface GhBaseQueryOptions {
  client?: GitHubClient | undefined;
}

export function createGhBaseQuery(options: GhBaseQueryOptions = {}): GhBaseQuery {
  const client = options.client ?? createGitHubClient({ userAgent: 'gh-dashboard' });

  const rawBaseQuery: GhBaseQuery = async (request, api) => {
    try {
      // `api.forced` is RTK Query's "the user asked for this" flag: `refetch()` and
      // `forceRefetch` set it, a mount or an arg change does not. So ordinary navigation
      // keeps the free disk cache and only a deliberate refresh pays for a round trip.
      const { data, meta } = await perform(client, request, {
        signal: api.signal,
        revalidate: api.forced ?? false,
      });
      // Every response carries the caller's remaining quota, so the chip stays current
      // without a dedicated request.
      if (meta.rateLimit) {
        api.dispatch(rateLimitObserved({ resource: meta.rateLimitResource, info: meta.rateLimit }));
      }
      // `GET /rate_limit` is the only call that reports buckets no response has touched,
      // and it is free — it is not billed against any of them.
      if (request.type === 'getRateLimit') {
        api.dispatch(rateLimitSnapshotReceived(data as RateLimitSnapshot));
      }
      return { data, meta };
    } catch (caught) {
      const error = toApiError(caught);
      if (error.kind === 'rate-limited' && error.resetAt) {
        api.dispatch(rateLimitObserved({ resource: 'core', exhaustedUntil: error.resetAt }));
      }
      // Bail out of the retry wrapper for everything a second attempt cannot fix.
      if (!error.retryable) return retry.fail(error);
      return { error };
    }
  };

  // `retry` is typed against an anonymous baseQuery and widens the result to `unknown`;
  // the wrapper does not change the contract, so the signature is restored here.
  return retry(rawBaseQuery, { maxRetries: MAX_RETRIES }) as GhBaseQuery;
}
