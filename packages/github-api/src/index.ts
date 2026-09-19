/**
 * `@gh/github-api` — framework-agnostic GitHub REST client.
 *
 * Zero React, zero Redux, zero sibling-package imports (enforced by the lint config).
 * Consumers get domain types and plain async functions; the DTOs stop at this boundary.
 */
export { createGitHubClient } from './client.js';
export type { GitHubClient, GitHubClientOptions, RepoRef, SearchReposParams } from './client.js';

export { DEFAULT_BASE_URL, buildUrl } from './http.js';
export type { GhResponse, RequestOptions, ResponseMeta } from './http.js';

export {
  AbortError,
  AuthError,
  GitHubError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
  isGitHubError,
  isRetryable,
} from './errors.js';

export {
  isRateLimited,
  parseRateLimitHeaders,
  parseRetryAfter,
  rateLimitResourceOf,
  toRateLimitSnapshot,
} from './rate-limit.js';

export {
  toCommitSummary,
  toContributor,
  toLanguageSlices,
  toRepoDetail,
  toRepoSnapshot,
  toRepoStats,
  toRepoSummary,
  toSearchResult,
  toTrackedRepo,
  toWeeklyCommitActivity,
} from './mappers.js';

export { parseRepoId, toRepoId } from './types/domain.js';
export type * from './types/domain.js';
export type * from './types/dto.js';
