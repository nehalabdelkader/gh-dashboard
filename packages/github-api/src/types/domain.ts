/**
 * Domain types — the only vocabulary the rest of the app speaks.
 *
 * Deliberately smaller and flatter than the GitHub DTOs: every field here is one a view
 * actually renders, dates are ISO strings, and nothing is `null` where `undefined` reads
 * better. See `../mappers.ts` for the DTO -> domain narrowing.
 */

/** Stable identity for a repo across store, cache keys and URLs: `"facebook/react"`. */
export type RepoId = string;

export interface RepoOwner {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

/** The numbers a card or a chart renders. */
export interface RepoStats {
  stars: number;
  openIssues: number;
  forks: number;
  watchers: number;
}

/** Enough to render a search row or a tracked card. */
export interface RepoSummary {
  id: RepoId;
  owner: string;
  name: string;
  fullName: string;
  description: string | undefined;
  htmlUrl: string;
  defaultBranch: string;
  language: string | undefined;
  stats: RepoStats;
  /** Last push to *any* branch. Cheap but imprecise — prefer `CommitSummary.committedAt`. */
  pushedAt: string | undefined;
  updatedAt: string | undefined;
  archived: boolean;
  ownerAvatarUrl: string;
}

/** Everything the detail page shows, on top of the summary. */
export interface RepoDetail extends RepoSummary {
  homepage: string | undefined;
  license: string | undefined;
  topics: string[];
  createdAt: string | undefined;
  size: number;
  isFork: boolean;
  isPrivate: boolean;
  subscribersCount: number | undefined;
  networkCount: number | undefined;
}

export interface CommitAuthor {
  name: string | undefined;
  login: string | undefined;
  avatarUrl: string | undefined;
}

export interface CommitSummary {
  sha: string;
  /** ISO-8601. The committer date on the default branch — the real "last commit". */
  committedAt: string | undefined;
  message: string;
  htmlUrl: string;
  author: CommitAuthor;
}

export interface SearchResult {
  items: RepoSummary[];
  totalCount: number;
  incompleteResults: boolean;
  /** GitHub caps search at 1000 results regardless of `total_count`. */
  hasMore: boolean;
  page: number;
  perPage: number;
}

export interface LanguageSlice {
  language: string;
  bytes: number;
  /** 0–1, of total bytes. Precomputed so the chart stays dumb. */
  share: number;
}

export interface Contributor {
  login: string;
  contributions: number;
  avatarUrl: string;
  htmlUrl: string;
}

/** One rate-limit bucket, parsed from response headers or `GET /rate_limit`. */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  used: number;
  /** ISO-8601 instant the bucket refills. */
  resetAt: string;
}

export interface RateLimitSnapshot {
  core: RateLimitInfo | undefined;
  search: RateLimitInfo | undefined;
}

/**
 * A repo the user follows — a **reference**, nothing more.
 *
 * Identity only: everything renderable (stars, description, default branch, last commit)
 * is server state and belongs to the query cache, keyed by these same two fields. Holding
 * a copy here would mean two sources of truth for one repo, a localStorage blob that grows
 * with every field GitHub adds, and a persisted `stars: 41200` that silently rots.
 *
 * `id` is derived (`toRepoId(owner, name)`) but stored, because it is the key of the
 * normalized map and of every cache entry that describes this repo.
 */
export interface TrackedRepo {
  id: RepoId;
  owner: string;
  name: string;
}

/** `owner` + `name` -> `"owner/name"`. The one place the id format is defined. */
export function toRepoId(owner: string, name: string): RepoId {
  return `${owner}/${name}`;
}

/** Inverse of {@link toRepoId}. Returns `undefined` for anything that is not `a/b`. */
export function parseRepoId(id: RepoId): { owner: string; name: string } | undefined {
  const parts = id.split('/');
  if (parts.length !== 2) return undefined;
  const [owner, name] = parts;
  if (!owner || !name) return undefined;
  return { owner, name };
}
