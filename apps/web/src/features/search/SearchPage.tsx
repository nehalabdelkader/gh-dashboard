import { useState } from 'react';
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

/** Below this, searching is noise — and search has its own 10 req/min bucket to protect. */
export const MIN_QUERY_LENGTH = 2;

export function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const { page, perPage, next, previous, reset, canPrevious } = usePagination({ perPage: 20 });

  const trimmed = debouncedQuery.trim();
  const isSearchable = trimmed.length >= MIN_QUERY_LENGTH;

  // `skipToken` rather than `{ skip }`: it makes "there is no argument yet" a type, so a
  // one-character query cannot accidentally become a request, and `data` stays `undefined`
  // in a way TypeScript enforces.
  // `currentData` rather than `data`: `data` is the last result for *any* arg, so it keeps
  // page 1's rows while page 2 is in flight — which is exactly what suppresses the skeleton.
  const {
    currentData: data,
    error,
    isFetching,
    refetch,
  } = useSearchReposQuery(isSearchable ? { q: trimmed, page, perPage } : skipToken);

  // Reset on the *input* change, not in an effect on `trimmed`: an effect would fire after
  // the debounce, one render late, and page 4 of the new query would already be in flight.
  const handleQueryChange = (value: string) => {
    setQuery(value);
    reset();
  };

  const items: readonly RepoCardRepo[] = data?.items ?? [];
  const display = toErrorDisplay(error);
  const isTracked = (_repo: RepoCardRepo) => false;
  const onToggleTrack = (_repo: RepoCardRepo) => {};

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
            items={items}
            isTracked={isTracked}
            onToggleTrack={onToggleTrack}
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
              {/* Gated on `hasMore`, never on `totalCount`: GitHub caps search at 1000
                    results and 422s past it, and the client already folds that cap in. */}
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
