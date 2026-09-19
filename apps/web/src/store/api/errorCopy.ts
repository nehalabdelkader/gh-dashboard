import { formatDuration, type ErrorSeverity } from '@gh/ui';
import { isApiError, type ApiError } from './errors.js';

/** Everything `ErrorState` needs, plus whether the app should offer a retry at all. */
export interface ErrorDisplay {
  title: string;
  message: string;
  severity: ErrorSeverity;
  /**
   * Retrying a 404 or a spent quota only burns what is left of the 60/hr. Kept separate
   * from the copy so the caller decides *what* retry means — refetch, reload, go back.
   */
  retryable: boolean;
}

function rateLimitMessage(resetAt: string | undefined, now: number): string {
  const base = 'Unauthenticated requests are capped at 60 per hour.';
  if (!resetAt) return base;
  const target = new Date(resetAt).getTime();
  if (Number.isNaN(target)) return base;
  return `${base} Resets in ${formatDuration(target - now)}.`;
}

/**
 * Failure -> words.
 *
 * Lives in the app because it is the only layer that knows both halves: what the GitHub
 * client's error kinds mean, and what this product wants to say about them. `@gh/ui`
 * renders whatever copy it is handed, which is what keeps it usable against any API.
 *
 * The client distinguishes eight kinds because the *retry policy* needs them; there are
 * fewer messages here because several failures leave the user with the same single
 * option. That collapse is a product decision, so it belongs on this side.
 */
export function toErrorDisplay(error: unknown, now = Date.now()): ErrorDisplay | undefined {
  if (error === undefined || error === null) return undefined;

  if (!isApiError(error)) {
    return {
      title: 'Something went wrong',
      message: 'The request failed. Try again in a moment.',
      severity: 'error',
      retryable: true,
    };
  }

  const apiError: ApiError = error;

  switch (apiError.kind) {
    case 'not-found':
      return {
        title: 'Repository not found',
        message: 'It may have been renamed, deleted, or made private.',
        severity: 'warning',
        retryable: false,
      };
    case 'rate-limited':
      return {
        title: 'GitHub rate limit reached',
        message: rateLimitMessage(apiError.resetAt, now),
        severity: 'warning',
        retryable: false,
      };
    case 'network':
      return {
        title: "Couldn't reach GitHub",
        message: 'Check your connection and try again.',
        severity: 'error',
        retryable: true,
      };
    case 'validation':
      return {
        title: 'GitHub rejected that search',
        message: 'Try simplifying the query.',
        severity: 'warning',
        retryable: false,
      };
    default:
      return {
        title: 'Something went wrong',
        message: apiError.message,
        severity: 'error',
        retryable: apiError.retryable,
      };
  }
}

/** `ErrorDisplay` -> `ErrorState` props, attaching the retry only where it can help. */
export function toErrorStateProps(display: ErrorDisplay, onRetry?: () => void) {
  const { retryable, ...copy } = display;
  return { ...copy, onRetry: retryable ? onRetry : undefined };
}
