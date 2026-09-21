/**
 * The server-state layer.
 *
 * RTK Query keys its cache **per argument**, so `getRepo({owner:'facebook',name:'react'})`
 * owns its own `isFetching`, `error` and `data`. That is the brief's "independent loading
 * and error states per repo" — implemented by the library rather than by hand-rolling a
 * `Record<repoId, LoadingState>` that every reducer then has to keep consistent.
 */
import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  CommitSummary,
  Contributor,
  LanguageSlice,
  RateLimitSnapshot,
  RepoDetail,
  SearchResult,
} from '@gh/github-api';
import type { RepoId } from '@gh/github-api';
import { toRepoId } from '@gh/github-api';
import { createGhBaseQuery, type GhRequest, type GhResult } from './baseQuery.js';
import type { ApiError } from './errors.js';

export interface RepoArg {
  owner: string;
  name: string;
}

export interface LastCommitArg extends RepoArg {
  /** The default branch. Omitted falls back to whatever GitHub considers default. */
  ref?: string | undefined;
}

export interface SearchArg {
  q: string;
  page?: number | undefined;
  perPage?: number | undefined;
}

/** Lifetimes in seconds. A repo's stats move slowly; a search result set moves faster. */
const KEEP_SEARCH = 60;
const KEEP_REPO = 300;

/**
 * The `getRepo` cache key.
 *
 * Pinned to the repo id rather than left to RTK Query's default arg serialization, because
 * the tracked list stores *only* references: anything that wants a tracked repo's stats
 * (the stars chart, say) has to find its cache entry from an id alone. A key spelled here
 * once is a contract; a key reverse-engineered from `JSON.stringify` order is a bug in
 * waiting. It reads as `getRepo(facebook/react)` in devtools, too.
 */
export const repoCacheKey = (id: RepoId): string => `getRepo(${id})`;

export const githubApi = createApi({
  reducerPath: 'githubApi',
  baseQuery: createGhBaseQuery(),
  tagTypes: ['Repo', 'Commit'],
  // Cold loads render from the persisted snapshot, so a refetch on *every* mount would
  // spend quota re-fetching what is already on screen. A cache entry is fetched once and
  // then re-fetched only when its tag is invalidated — see `Repo`/`Commit` below.
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    searchRepos: builder.query<SearchResult, SearchArg>({
      query: (arg): GhRequest => ({
        type: 'searchRepos',
        params: { q: arg.q, page: arg.page ?? 1, perPage: arg.perPage ?? 20 },
      }),
      transformResponse: (response: GhResult) => response as SearchResult,
      keepUnusedDataFor: KEEP_SEARCH,
    }),

    getRepo: builder.query<RepoDetail, RepoArg>({
      query: (ref): GhRequest => ({ type: 'getRepo', ref }),
      serializeQueryArgs: ({ queryArgs }) =>
        repoCacheKey(toRepoId(queryArgs.owner, queryArgs.name)),
      transformResponse: (response: GhResult) => response as RepoDetail,
      keepUnusedDataFor: KEEP_REPO,
      providesTags: (_result, _error, arg) => [{ type: 'Repo', id: toRepoId(arg.owner, arg.name) }],
    }),

    /** `null` data is a real answer: a repo with no commits on its default branch. */
    getLastCommit: builder.query<CommitSummary | null, LastCommitArg>({
      query: (arg): GhRequest => ({
        type: 'getLastCommit',
        ref: { owner: arg.owner, name: arg.name, sha: arg.ref },
      }),
      transformResponse: (response: GhResult) => response as CommitSummary | null,
      keepUnusedDataFor: KEEP_REPO,
      providesTags: (_result, _error, arg) => [
        { type: 'Commit', id: toRepoId(arg.owner, arg.name) },
      ],
    }),

    getLanguages: builder.query<LanguageSlice[], RepoArg>({
      query: (ref): GhRequest => ({ type: 'getLanguages', ref }),
      transformResponse: (response: GhResult) => response as LanguageSlice[],
      keepUnusedDataFor: KEEP_REPO,
    }),

    getContributors: builder.query<Contributor[], RepoArg & { limit?: number | undefined }>({
      query: (ref): GhRequest => ({ type: 'getContributors', ref }),
      transformResponse: (response: GhResult) => response as Contributor[],
      keepUnusedDataFor: KEEP_REPO,
    }),

    getRateLimit: builder.query<RateLimitSnapshot, void>({
      query: (): GhRequest => ({ type: 'getRateLimit' }),
      transformResponse: (response: GhResult) => response as RateLimitSnapshot,
      keepUnusedDataFor: 0,
    }),
  }),
});

export const {
  useSearchReposQuery,
  useGetRepoQuery,
  useGetLastCommitQuery,
  useGetLanguagesQuery,
  useGetContributorsQuery,
  useGetRateLimitQuery,
} = githubApi;

/** RTK Query's error slot holds our `ApiError` — this is the typed way back out of it. */
export type GithubApiError = ApiError;
