/**
 * Serializable errors for the store.
 *
 * `@gh/github-api` throws class instances, but a Redux store may only hold plain data:
 * RTK Query puts the error in state, DevTools serializes it, and `instanceof` does not
 * survive either trip. So the boundary flattens the hierarchy into a tagged object, and
 * everything downstream — retry policy, `ErrorState` copy — switches on `kind`.
 */
import {
  AbortError,
  AuthError,
  GitHubError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
} from '@gh/github-api';

export type ApiErrorKind =
  | 'not-found'
  | 'rate-limited'
  | 'network'
  | 'auth'
  | 'validation'
  | 'server'
  | 'aborted'
  | 'generic';

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  status?: number | undefined;
  /** ISO-8601, `rate-limited` only. Lets the UI say "resets in 12m". */
  resetAt?: string | undefined;
  /**
   * Whether a retry has any chance. Read by the `retry` wrapper to decide between backing
   * off and bailing out — retrying a 404 or a spent quota only burns what is left of it.
   */
  retryable: boolean;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof RateLimitError) {
    return {
      kind: 'rate-limited',
      message: error.message,
      status: error.status,
      resetAt: error.resetAt,
      retryable: false,
    };
  }
  if (error instanceof NotFoundError) {
    return { kind: 'not-found', message: error.message, status: error.status, retryable: false };
  }
  if (error instanceof AbortError) {
    return { kind: 'aborted', message: error.message, retryable: false };
  }
  if (error instanceof NetworkError) {
    return { kind: 'network', message: error.message, retryable: true };
  }
  if (error instanceof ServerError) {
    return { kind: 'server', message: error.message, status: error.status, retryable: true };
  }
  if (error instanceof AuthError) {
    return { kind: 'auth', message: error.message, status: error.status, retryable: false };
  }
  if (error instanceof ValidationError) {
    return { kind: 'validation', message: error.message, status: error.status, retryable: false };
  }
  if (error instanceof GitHubError) {
    return { kind: 'generic', message: error.message, status: error.status, retryable: false };
  }
  return {
    kind: 'generic',
    message: error instanceof Error ? error.message : 'Request failed',
    retryable: false,
  };
}

/** Narrows RTK Query's `unknown` error back to ours at the call site. */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    'retryable' in error &&
    typeof (error as ApiError).message === 'string'
  );
}
