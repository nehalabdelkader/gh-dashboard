/**
 * DTO -> domain narrowing. The boundary the whole package exists to draw.
 *
 * Two rules: GitHub's `null` becomes `undefined` (optional chaining reads better than
 * null checks everywhere downstream), and nothing leaves here with a wire-shaped name.
 */
import { toRepoId } from './types/domain.js';
import type {
  CommitSummary,
  Contributor,
  LanguageSlice,
  RepoDetail,
  RepoSnapshot,
  RepoStats,
  RepoSummary,
  SearchResult,
  TrackedRepo,
  WeeklyCommitActivity,
} from './types/domain.js';
import type {
  GhCommit,
  GhCommitActivity,
  GhContributor,
  GhFullRepo,
  GhLanguages,
  GhRepoLike,
  GhSearchReposResponse,
} from './types/dto.js';

/** GitHub caps search results at 1000 no matter what `total_count` claims. */
const SEARCH_RESULT_CAP = 1000;

function orUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

export function toRepoStats(dto: GhRepoLike): RepoStats {
  return {
    stars: dto.stargazers_count ?? 0,
    // `open_issues_count` includes open PRs. Named plainly here; the UI labels it
    // "open issues" because that is what GitHub's own repo header calls it.
    openIssues: dto.open_issues_count ?? 0,
    forks: dto.forks_count ?? 0,
    watchers: dto.watchers_count ?? 0,
  };
}

export function toRepoSummary(dto: GhRepoLike): RepoSummary {
  const owner = dto.owner?.login ?? dto.full_name.split('/')[0] ?? '';
  return {
    id: toRepoId(owner, dto.name),
    owner,
    name: dto.name,
    fullName: dto.full_name,
    description: orUndefined(dto.description),
    htmlUrl: dto.html_url,
    defaultBranch: dto.default_branch ?? 'main',
    language: orUndefined(dto.language),
    stats: toRepoStats(dto),
    pushedAt: orUndefined(dto.pushed_at),
    updatedAt: orUndefined(dto.updated_at),
    archived: dto.archived ?? false,
    ownerAvatarUrl: dto.owner?.avatar_url ?? '',
  };
}

export function toRepoDetail(dto: GhFullRepo): RepoDetail {
  return {
    ...toRepoSummary(dto),
    homepage: orUndefined(dto.homepage),
    license: orUndefined(dto.license?.name),
    topics: dto.topics ?? [],
    createdAt: orUndefined(dto.created_at),
    size: dto.size,
    isFork: dto.fork,
    isPrivate: dto.private,
    subscribersCount: orUndefined(dto.subscribers_count),
    networkCount: orUndefined(dto.network_count),
  };
}

export function toSearchResult(
  dto: GhSearchReposResponse,
  page: number,
  perPage: number,
): SearchResult {
  const seen = page * perPage;
  return {
    items: dto.items.map(toRepoSummary),
    totalCount: dto.total_count,
    incompleteResults: dto.incomplete_results,
    hasMore: dto.items.length === perPage && seen < Math.min(dto.total_count, SEARCH_RESULT_CAP),
    page,
    perPage,
  };
}

export function toCommitSummary(dto: GhCommit): CommitSummary {
  return {
    sha: dto.sha,
    // Committer date, not author date: a rebased or cherry-picked commit keeps its
    // original author date, which would misreport the repo as stale.
    committedAt: orUndefined(dto.commit.committer?.date ?? dto.commit.author?.date),
    message: dto.commit.message,
    htmlUrl: dto.html_url,
    author: {
      name: orUndefined(dto.commit.author?.name),
      login: orUndefined(dto.author?.login),
      avatarUrl: orUndefined(dto.author?.avatar_url),
    },
  };
}

/** `{ TypeScript: 12000, CSS: 3000 }` -> slices sorted desc, with shares precomputed. */
export function toLanguageSlices(dto: GhLanguages): LanguageSlice[] {
  const entries = Object.entries(dto);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return entries
    .map(([language, bytes]) => ({
      language,
      bytes,
      share: total === 0 ? 0 : bytes / total,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function toContributor(dto: GhContributor): Contributor {
  return {
    // Anonymous contributors have no login, only an email-derived name.
    login: dto.login ?? dto.name ?? 'unknown',
    contributions: dto.contributions,
    avatarUrl: dto.avatar_url ?? '',
    htmlUrl: dto.html_url ?? '',
  };
}

export function toWeeklyCommitActivity(dto: GhCommitActivity[]): WeeklyCommitActivity[] {
  return dto.map((week) => ({
    weekStart: new Date(week.week * 1000).toISOString(),
    total: week.total,
  }));
}

/** Starts tracking a repo. The snapshot fills in on the first successful fetch. */
export function toTrackedRepo(
  repo: RepoSummary,
  trackedAt: string = new Date().toISOString(),
): TrackedRepo {
  return {
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    htmlUrl: repo.htmlUrl,
    defaultBranch: repo.defaultBranch,
    trackedAt,
    snapshot: undefined,
  };
}

/** What gets persisted after a refresh, so a cold load renders before any request lands. */
export function toRepoSnapshot(
  repo: RepoSummary,
  lastCommitAt: string | undefined,
  fetchedAt: string = new Date().toISOString(),
): RepoSnapshot {
  return {
    stats: repo.stats,
    lastCommitAt: lastCommitAt ?? repo.pushedAt,
    fetchedAt,
  };
}
