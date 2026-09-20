import type { ReactNode } from 'react';
import List from '@mui/material/List';
import type { RepoCardRepo } from '../types.js';
import { EmptyState } from './EmptyState.js';
import { ErrorState, type ErrorStateProps } from './ErrorState.js';
import { LoadingSkeleton } from './LoadingSkeleton.js';
import { RepoListItem } from './RepoListItem.js';

export interface RepoListProps {
  items: readonly RepoCardRepo[];
  /** Membership is a set lookup in the caller, not a field on the row's data. */
  isTracked: (repo: RepoCardRepo) => boolean;
  onToggleTrack: (repo: RepoCardRepo) => void;
  onOpen?: ((repo: RepoCardRepo) => void) | undefined;
  loading?: boolean | undefined;
  /**
   * Finished copy, not an error object: the list renders what it is handed. Including or
   * omitting `onRetry` is how the caller says whether retrying is worth a request.
   */
  error?: ErrorStateProps | undefined;
  emptyState?: ReactNode | undefined;
  /** Pagination controls, an infinite-scroll sentinel — whatever the page needs. */
  footer?: ReactNode | undefined;
  busyIds?: ReadonlySet<string> | undefined;
}

/** Renders the list, plus the three states that are not "a list": loading, error, empty. */
export function RepoList({
  items,
  isTracked,
  onToggleTrack,
  onOpen,
  loading,
  error,
  emptyState,
  footer,
  busyIds,
}: RepoListProps) {
  if (error) {
    return <ErrorState {...error} />;
  }

  if (loading && items.length === 0) {
    // Footer stays mounted: it carries the pagination controls, and yanking them out from
    // under the cursor on every page change is worse than showing them momentarily disabled.
    return (
      <>
        <LoadingSkeleton variant="list-row" count={5} />
        {footer}
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {emptyState ?? (
          <EmptyState title="No repositories found" description="Try a different search term." />
        )}
      </>
    );
  }

  return (
    <>
      <List disablePadding>
        {items.map((repo) => (
          <RepoListItem
            key={repo.id}
            repo={repo}
            tracked={isTracked(repo)}
            onToggleTrack={onToggleTrack}
            onOpen={onOpen}
            busy={busyIds?.has(repo.id) ?? false}
          />
        ))}
      </List>
      {footer}
    </>
  );
}
