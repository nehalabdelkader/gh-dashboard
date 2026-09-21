/**
 * The GitHub client: a factory returning plain async functions.
 *
 * No React, no Redux, no singleton. Every function takes an `AbortSignal` and returns
 * domain types plus response meta, which is all the data layer needs to build per-repo
 * cache entries on top of it — and all a CLI or a test would need too.
 *
 * Unauthenticated by design: no token is sent, so the core limit is a hard 60 req/hr.
 * See plan §6 for what that costs and the two ways out of it.
 */
import {
  DEFAULT_BASE_URL,
  request,
  type GhResponse,
  type HttpClientConfig,
  type RequestOptions,
} from './http.js';
import {
  toCommitSummary,
  toContributor,
  toLanguageSlices,
  toRepoDetail,
  toSearchResult,
} from './mappers.js';
import { toRateLimitSnapshot } from './rate-limit.js';
import type {
  CommitSummary,
  Contributor,
  LanguageSlice,
  RateLimitSnapshot,
  RepoDetail,
  SearchResult,
} from './types/domain.js';
import type {
  GhCommit,
  GhContributor,
  GhFullRepo,
  GhLanguages,
  GhRateLimitOverview,
  GhSearchReposResponse,
} from './types/dto.js';

export interface GitHubClientOptions {
  baseUrl?: string | undefined;
  /** Injectable for tests and for a future server-side proxy. */
  fetch?: typeof globalThis.fetch | undefined;
  userAgent?: string | undefined;
}

export interface RepoRef {
  owner: string;
  name: string;
}

export interface SearchReposParams {
  q: string;
  page?: number | undefined;
  perPage?: number | undefined;
  sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated' | undefined;
  order?: 'asc' | 'desc' | undefined;
}

export interface GitHubClient {
  searchRepositories(
    params: SearchReposParams,
    options?: RequestOptions,
  ): Promise<GhResponse<SearchResult>>;
  getRepository(ref: RepoRef, options?: RequestOptions): Promise<GhResponse<RepoDetail>>;
  /** `undefined` data when the default branch has no commits yet (a fresh empty repo). */
  getLastCommit(
    ref: RepoRef & { sha?: string | undefined },
    options?: RequestOptions,
  ): Promise<GhResponse<CommitSummary | undefined>>;
  getLanguages(ref: RepoRef, options?: RequestOptions): Promise<GhResponse<LanguageSlice[]>>;
  getContributors(
    ref: RepoRef & { limit?: number | undefined },
    options?: RequestOptions,
  ): Promise<GhResponse<Contributor[]>>;
  getRateLimit(options?: RequestOptions): Promise<GhResponse<RateLimitSnapshot>>;
}

const DEFAULT_PER_PAGE = 20;

function encode(segment: string): string {
  return encodeURIComponent(segment);
}

export function createGitHubClient(options: GitHubClientOptions = {}): GitHubClient {
  const config: HttpClientConfig = {
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    // Bound at call time via the wrapper so a swapped global `fetch` (MSW) is picked up.
    fetch: options.fetch ?? ((input, init) => globalThis.fetch(input, init)),
    userAgent: options.userAgent,
  };

  return {
    async searchRepositories(params, requestOptions) {
      const page = params.page ?? 1;
      const perPage = params.perPage ?? DEFAULT_PER_PAGE;
      const response = await request<GhSearchReposResponse>(
        config,
        {
          path: '/search/repositories',
          query: {
            q: params.q,
            sort: params.sort ?? 'stars',
            order: params.order ?? 'desc',
            per_page: perPage,
            page,
          },
        },
        requestOptions,
      );
      return { data: toSearchResult(response.data, page, perPage), meta: response.meta };
    },

    async getRepository(ref, requestOptions) {
      const response = await request<GhFullRepo>(
        config,
        { path: `/repos/${encode(ref.owner)}/${encode(ref.name)}` },
        requestOptions,
      );
      return { data: toRepoDetail(response.data), meta: response.meta };
    },

    async getLastCommit(ref, requestOptions) {
      const response = await request<GhCommit[]>(
        config,
        {
          path: `/repos/${encode(ref.owner)}/${encode(ref.name)}/commits`,
          // Pinned to a ref so the date is the default branch's, not any branch's —
          // which is exactly where `pushed_at` misleads.
          query: { per_page: 1, ...(ref.sha ? { sha: ref.sha } : {}) },
        },
        requestOptions,
      );
      const first = response.data[0];
      return { data: first ? toCommitSummary(first) : undefined, meta: response.meta };
    },

    async getLanguages(ref, requestOptions) {
      const response = await request<GhLanguages>(
        config,
        { path: `/repos/${encode(ref.owner)}/${encode(ref.name)}/languages` },
        requestOptions,
      );
      return { data: toLanguageSlices(response.data), meta: response.meta };
    },

    async getContributors(ref, requestOptions) {
      const response = await request<GhContributor[]>(
        config,
        {
          path: `/repos/${encode(ref.owner)}/${encode(ref.name)}/contributors`,
          query: { per_page: ref.limit ?? 5 },
        },
        requestOptions,
      );
      return { data: response.data.map(toContributor), meta: response.meta };
    },

    async getRateLimit(requestOptions) {
      const response = await request<GhRateLimitOverview>(
        config,
        // Free: this endpoint is not billed against any bucket.
        { path: '/rate_limit' },
        requestOptions,
      );
      return { data: toRateLimitSnapshot(response.data), meta: response.meta };
    },
  };
}
