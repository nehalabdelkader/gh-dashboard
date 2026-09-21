/**
 * `TrackedRepo` + cached server data -> `RepoCardRepo`.
 *
 * The mapping lives in the app because this is the only layer that knows both shapes:
 * `@gh/ui` takes a structural prop type and `@gh/github-api` owns the domain type, and
 * neither is allowed to import the other.
 *
 * The tracked entry is a bare reference, so everything renderable comes from `detail` —
 * whatever the query cache holds for this repo. Before the first fetch resolves there is
 * nothing but the id, and the card renders from that alone: `owner/name` as the title and
 * zeroed stats. An honest empty card beats an absent one, and beats stale numbers
 * presented as current.
 */
import type { RepoCardRepo } from '@gh/ui';
import type { RepoDetail, TrackedRepo } from '@gh/github-api';

export interface CachedRepoView {
  detail: RepoDetail | undefined;
  /** ISO-8601 committer date on the default branch, from `getLastCommit`. */
  lastCommitAt: string | undefined;
}

export function toRepoCardRepo(repo: TrackedRepo, view: CachedRepoView): RepoCardRepo {
  const detail = view.detail;
  return {
    id: repo.id,
    owner: repo.owner,
    name: repo.name,
    fullName: detail?.fullName ?? repo.id,
    description: detail?.description,
    // `github.com/<owner>/<name>` is the canonical URL and needs no fetch to construct, so
    // the card's link works before any request lands.
    htmlUrl: detail?.htmlUrl ?? `https://github.com/${repo.id}`,
    language: detail?.language,
    archived: detail?.archived,
    // `github.com/<login>.png` is a stable redirect that costs no API quota.
    ownerAvatarUrl: detail?.ownerAvatarUrl ?? `https://github.com/${repo.owner}.png?size=64`,
    stats: {
      stars: detail?.stats.stars ?? 0,
      openIssues: detail?.stats.openIssues ?? 0,
      forks: detail?.stats.forks,
      watchers: detail?.stats.watchers,
    },
    lastCommitAt: view.lastCommitAt,
  };
}
