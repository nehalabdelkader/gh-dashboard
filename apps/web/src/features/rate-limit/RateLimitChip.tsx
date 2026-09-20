/**
 * The header quota chip.
 *
 * Unauthenticated the whole app lives inside 60 core requests an hour, so the number is
 * not a curiosity — it is the budget the user is spending, and it belongs on screen before
 * they hit the wall rather than in the error state after.
 *
 * Reads the store, not the query: every response's headers already feed `rateLimitSlice`
 * via the baseQuery, so the chip is current the moment anything else fetches. The poll is
 * the floor under that — `GET /rate_limit` is itself free (not billed against any bucket),
 * and it is the only call that reports buckets nothing has touched yet, such as `search`
 * before the first search.
 */
import { Chip, Tooltip, formatDuration } from '@gh/ui';
import { useGetRateLimitQuery } from '@/store/api/githubApi.js';
import { useAppSelector } from '@/store/hooks.js';
import { selectCoreRateLimit, selectSearchRateLimit } from '@/store/meta/rateLimitSlice.js';

const POLL_MS = 60_000;

/** Amber before the budget is gone, not once it is — a warning after the fact is useless. */
const LOW_REMAINING = 10;

function resetLabel(resetAt: string | undefined, now: number): string {
  if (!resetAt) return 'reset time unknown';
  const target = new Date(resetAt).getTime();
  if (Number.isNaN(target)) return 'reset time unknown';
  return `resets in ${formatDuration(target - now)}`;
}

export function RateLimitChip() {
  useGetRateLimitQuery(undefined, { pollingInterval: POLL_MS, refetchOnMountOrArgChange: true });

  const core = useAppSelector(selectCoreRateLimit);
  const search = useAppSelector(selectSearchRateLimit);

  // No reading yet means no request has come back and the poll has not landed. Rendering
  // "0 left" there would be a lie in the worst direction, so the chip stays away.
  if (!core) return null;

  const now = Date.now();
  const exhausted = core.remaining === 0;
  const low = core.remaining <= LOW_REMAINING;

  const searchLine = search
    ? `Search: ${String(search.remaining)}/${String(search.limit)} (${resetLabel(search.resetAt, now)})`
    : 'Search: no reading yet';

  return (
    <Tooltip
      title={
        <>
          {`API: ${String(core.remaining)}/${String(core.limit)} (${resetLabel(core.resetAt, now)})`}
          <br />
          {searchLine}
          <br />
          Unauthenticated requests are capped at 60 per hour.
        </>
      }
    >
      <Chip
        size="small"
        variant="outlined"
        color={exhausted ? 'error' : low ? 'warning' : 'default'}
        label={`${String(core.remaining)}/${String(core.limit)}`}
        aria-label={`GitHub API quota: ${String(core.remaining)} of ${String(core.limit)} requests remaining, ${resetLabel(core.resetAt, now)}`}
      />
    </Tooltip>
  );
}
