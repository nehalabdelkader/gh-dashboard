import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  Button,
  EmptyState,
  RepoList,
  SearchField,
  SearchIcon,
  Stack,
  Typography,
  type RepoCardRepo,
} from '@gh/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue.js';
import { usePagination } from '@/hooks/usePagination.js';
import { useSearchReposQuery } from '@/store/api/githubApi.js';
import { toErrorDisplay, toErrorStateProps } from '@/store/api/errorCopy.js';
import { useAppSelector, useAppDispatch } from '@/store/hooks.js';
import { trackRepo, untrackRepo } from '@/store/tracked/trackedSlice.js';
import { repoDetailPath } from '@/app/routes.js';

/** Below this, results are noise — and search has its own 10 req/min bucket to protect. */
export const MIN_QUERY_LENGTH = 2;

export function SearchPage() {
  // --- state ---
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const { page, perPage, next, previous, reset, canPrevious } = usePagination({ perPage: 20 });

  // --- store ---
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const trackedEntities = useAppSelector((state) => state.tracked.entities);

  // --- query ---
  const trimmed = debouncedQuery.trim();
  const isSearchable = trimmed.length >= MIN_QUERY_LENGTH;

  // `skipToken` makes "no query yet" a type, so a one-char query can't become a request.
  // `currentData` (not `data`) is scoped to the current arg, so page 2 shows a skeleton
  // instead of page 1's rows.
  const {
    currentData: data,
    error,
    isFetching,
    refetch,
  } = useSearchReposQuery(isSearchable ? { q: trimmed, page, perPage } : skipToken);

  // --- derived ---
  const display = toErrorDisplay(error);

  // Rows come back as `RepoCardRepo`, which has no `defaultBranch` — tracking needs it.
  // Look the full `RepoSummary` back up here instead of widening the `@gh/ui` props.
  const byId = useMemo(() => new Map((data?.items ?? []).map((repo) => [repo.id, repo])), [data]);

  // --- handlers ---
  // Reset here, not in an effect on `trimmed`: an effect fires after the debounce, one
  // render late, and page 4 of the new query is already in flight.
  const handleQueryChange = (value: string) => {
    setQuery(value);
    reset();
  };

  const isTracked = (row: RepoCardRepo) => row.id in trackedEntities;

  const onToggleTrack = (row: RepoCardRepo) => {
    if (row.id in trackedEntities) {
      dispatch(untrackRepo(row.id));
      return;
    }
    const repo = byId.get(row.id);
    if (!repo) return;
    // The reference, nothing else. The search row's stats are already in the query cache
    // and the tracked page reads them from there — copying them into client state would
    // just create a second, slowly rotting version of the same numbers.
    dispatch(trackRepo({ owner: repo.owner, name: repo.name }));
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h2" component="h1">
          Search repositories
        </Typography>
        <SearchField
          value={query}
          onChange={handleQueryChange}
          loading={isFetching}
          helperText={
            query.length > 0 && !isSearchable
              ? `Type at least ${String(MIN_QUERY_LENGTH)} characters.`
              : ''
          }
          autoFocus
        />
      </Stack>

      {isSearchable ? (
        <>
          <RepoList
            items={data?.items ?? []}
            isTracked={isTracked}
            onToggleTrack={onToggleTrack}
            onOpen={(row) => void navigate(repoDetailPath(row.owner, row.name))}
            loading={isFetching}
            error={display ? toErrorStateProps(display, refetch) : undefined}
          />

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ pt: 2 }}
          >
            <Typography variant="caption" color="text.secondary">
              Page {page}
              {data ? ` · ${data.totalCount.toLocaleString()} results` : null}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                onClick={previous}
                disabled={!canPrevious || isFetching}
                variant="outlined"
              >
                Previous
              </Button>
              {/* `hasMore`, never `totalCount`: GitHub caps search at 1000 results and
                  422s past it. The client already folds that cap in. */}
              <Button
                size="small"
                onClick={next}
                disabled={!(data?.hasMore ?? false) || isFetching}
                variant="outlined"
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </>
      ) : (
        <EmptyState
          title="Search GitHub repositories"
          description="Find a repository by name, owner or keyword, then track it to watch its stars, open issues and last commit."
          icon={<SearchIcon fontSize="inherit" />}
        />
      )}
    </Stack>
  );
}
