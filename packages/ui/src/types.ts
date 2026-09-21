/**
 * Prop-level vocabulary for the design system.
 *
 * Deliberately *not* imported from `@gh/github-api`: packages never depend on each other,
 * so the shapes here are structural. The app's domain types (`RepoSummary`, `TrackedRepo`)
 * happen to satisfy them, which is what lets a container pass one straight through — but
 * `@gh/ui` stays usable with any data source that can produce these fields.
 */

/**
 * What a card is currently doing. This one prop drives every per-entity visual:
 * `loading` is a first fetch and `refreshing` a revalidation; both render the skeleton,
 * `error` shows the inline strip.
 */
export type RepoStatus = 'idle' | 'loading' | 'refreshing' | 'error';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface RepoCardStats {
  stars: number;
  openIssues: number;
  forks?: number | undefined;
  watchers?: number | undefined;
}

/** The subset of a repo any list row or card renders. */
export interface RepoCardRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description?: string | undefined;
  htmlUrl: string;
  language?: string | undefined;
  archived?: boolean | undefined;
  ownerAvatarUrl?: string | undefined;
  stats: RepoCardStats;
  /** ISO-8601 committer date on the default branch. */
  lastCommitAt?: string | undefined;
}
