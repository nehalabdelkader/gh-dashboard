import { useEffect, useState } from 'react';

/**
 * Trailing-edge debounce.
 *
 * Search has its own 10 requests/minute bucket, separate from the 60/hr core limit, so a
 * fast typist can exhaust it in seconds. Debouncing the *argument* rather than the request
 * means RTK Query never sees the intermediate values at all: no request to dedupe, no
 * response to discard.
 *
 * Note this only stops requests from starting. Requests already in flight are cancelled by
 * the `AbortSignal` RTK Query passes through to `@gh/github-api` — a different problem
 * with a different mechanism.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Every keystroke clears the previous timer, so only the final pause fires.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
