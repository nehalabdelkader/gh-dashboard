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
 * `loading` is a first fetch (skeleton), `refreshing` is a revalidation (spinner, stale
 * values still on screen), `error` shows the inline strip.
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
  /** ISO-8601 instant the values above were fetched — drives "updated 4m ago". */
  fetchedAt?: string | undefined;
}

/**
 * A failure rendered in the UI, flattened from the client's error hierarchy by the caller.
 *
 * The kind is what picks the copy: "that repo is gone" and "you are out of quota until
 * 14:32" are different messages, and only one of them is worth a retry button.
 */
export type ErrorKind = 'not-found' | 'rate-limited' | 'network' | 'generic';

export interface UiError {
  kind: ErrorKind;
  message?: string | undefined;
  /** ISO-8601, `rate-limited` only. Rendered as "resets in 12m". */
  resetAt?: string | undefined;
}
