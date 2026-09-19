import { useCallback, useMemo, useState } from 'react';

export interface UsePaginationOptions {
  /** Rows per request. GitHub caps this at 100. */
  perPage?: number | undefined;
  initialPage?: number | undefined;
}

export interface Pagination {
  page: number;
  perPage: number;
  next: () => void;
  previous: () => void;
  /** Jump straight to a page — what a `<Pagination>` control calls. */
  goTo: (page: number) => void;
  /** Back to page 1. Called whenever the *query* changes, not the page. */
  reset: () => void;
  setPerPage: (perPage: number) => void;
  /** Page 1 has nowhere to go back to — drives the Previous button's disabled state. */
  canPrevious: boolean;
}

/** GitHub rejects `per_page` above this. */
const MAX_PER_PAGE = 100;
const FIRST_PAGE = 1;

function clampPage(page: number): number {
  return Number.isFinite(page) ? Math.max(FIRST_PAGE, Math.trunc(page)) : FIRST_PAGE;
}

function clampPerPage(perPage: number): number {
  if (!Number.isFinite(perPage)) return 20;
  return Math.min(MAX_PER_PAGE, Math.max(1, Math.trunc(perPage)));
}

/**
 * Page cursor for a paged query.
 *
 * Owns nothing but two numbers: the caller feeds them to the query arg, and RTK Query
 * keys its cache per `{ q, page }`, so paging back to a page already seen is a cache read
 * rather than a request. That is why this hook holds no data and no loading flag — the
 * page is the *input* to the data layer, not a copy of its output.
 *
 * There is deliberately no upper bound here: how many pages exist is a property of the
 * response (`hasMore`), not of the cursor. The caller disables Next on `!hasMore`.
 */
export function usePagination({
  perPage: initialPerPage = 20,
  initialPage,
}: UsePaginationOptions = {}): Pagination {
  const [page, setPage] = useState(() => clampPage(initialPage ?? FIRST_PAGE));
  const [perPage, setPerPageState] = useState(() => clampPerPage(initialPerPage));

  const next = useCallback(() => setPage((current) => current + 1), []);
  const previous = useCallback(() => setPage((current) => Math.max(FIRST_PAGE, current - 1)), []);
  const goTo = useCallback((target: number) => setPage(clampPage(target)), []);
  const reset = useCallback(() => setPage(FIRST_PAGE), []);

  const setPerPage = useCallback((value: number) => {
    setPerPageState(clampPerPage(value));
    // Page 4 of 20-row pages is not page 4 of 100-row pages. Resizing without resetting
    // would ask for a page that may not exist and spend a request finding out.
    setPage(FIRST_PAGE);
  }, []);

  return useMemo(
    () => ({
      page,
      perPage,
      next,
      previous,
      goTo,
      reset,
      setPerPage,
      canPrevious: page > FIRST_PAGE,
    }),
    [page, perPage, next, previous, goTo, reset, setPerPage],
  );
}
