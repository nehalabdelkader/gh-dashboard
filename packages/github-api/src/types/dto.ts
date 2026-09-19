/**
 * Wire shapes, straight from GitHub's OpenAPI spec.
 *
 * Nothing outside this package should ever see one of these. `mappers.ts` narrows them
 * into the domain types in `./domain.ts`, and that boundary is what lets the transport
 * change without touching anything downstream.
 */
import type { components } from '@octokit/openapi-types';

export type GhFullRepo = components['schemas']['full-repository'];
export type GhMinimalRepo = components['schemas']['minimal-repository'];
export type GhRepoSearchResultItem = components['schemas']['repo-search-result-item'];
export type GhCommit = components['schemas']['commit'];
export type GhContributor = components['schemas']['contributor'];
export type GhLanguages = components['schemas']['language'];
export type GhCommitActivity = components['schemas']['commit-activity'];
export type GhRateLimitOverview = components['schemas']['rate-limit-overview'];

/** `GET /search/repositories` — the spec inlines this response, so it is spelled out here. */
export interface GhSearchReposResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GhRepoSearchResultItem[];
}

/** Anything with the star/issue counts a card needs — search item, minimal, or full repo. */
export type GhRepoLike = GhFullRepo | GhMinimalRepo | GhRepoSearchResultItem;
