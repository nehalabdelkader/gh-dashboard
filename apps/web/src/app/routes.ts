/**
 * Route paths in one place.
 *
 * Containers and `<Link>`s build URLs from these rather than from string literals, so a
 * path change is a one-line edit instead of a grep.
 */
export const ROUTES = {
  search: '/',
  tracked: '/tracked',
  repoDetail: '/repo/:owner/:name',
} as const;

/** `/repo/facebook/react` — segments are encoded because owner and name come from data. */
export function repoDetailPath(owner: string, name: string): string {
  return `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}
