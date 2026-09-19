import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ReactNode } from 'react';
import type { ErrorKind, UiError } from '../types.js';
import { formatDuration } from '../utils/format.js';

export interface ErrorStateProps {
  error: UiError;
  /** Omitted for `not-found` and `rate-limited` — retrying either only burns quota. */
  onRetry?: (() => void) | undefined;
  retryLabel?: string | undefined;
  /** `'inline'` is the strip inside a card; `'block'` is the full-width page state. */
  variant?: 'inline' | 'block' | undefined;
  action?: ReactNode | undefined;
  now?: Date | number | undefined;
}

const COPY: Record<ErrorKind, { title: string; message: string; severity: 'error' | 'warning' }> = {
  'not-found': {
    title: 'Repository not found',
    message: 'It may have been renamed, deleted, or made private.',
    severity: 'warning',
  },
  'rate-limited': {
    title: 'GitHub rate limit reached',
    message: 'Unauthenticated requests are capped at 60 per hour.',
    severity: 'warning',
  },
  network: {
    title: "Couldn't reach GitHub",
    message: 'Check your connection and try again.',
    severity: 'error',
  },
  generic: {
    title: 'Something went wrong',
    message: 'The request failed. Try again in a moment.',
    severity: 'error',
  },
};

const ICONS: Record<ErrorKind, ReactNode> = {
  'not-found': <SearchOffIcon fontSize="inherit" />,
  'rate-limited': <HourglassBottomIcon fontSize="inherit" />,
  network: <CloudOffIcon fontSize="inherit" />,
  generic: <WarningAmberIcon fontSize="inherit" />,
};

function resetCopy(
  resetAt: string | undefined,
  now: Date | number | undefined,
): string | undefined {
  if (!resetAt) return undefined;
  const target = new Date(resetAt).getTime();
  if (Number.isNaN(target)) return undefined;
  const base = now === undefined ? Date.now() : new Date(now).getTime();
  return `Resets in ${formatDuration(target - base)}.`;
}

/**
 * Typed failure copy. `kind` exists so the user reads "resets in 12m" instead of
 * "something went wrong" — the whole reason the client has an error hierarchy.
 */
export function ErrorState({
  error,
  onRetry,
  retryLabel = 'Retry',
  variant = 'block',
  action,
  now,
}: ErrorStateProps) {
  const copy = COPY[error.kind];
  const reset = error.kind === 'rate-limited' ? resetCopy(error.resetAt, now) : undefined;
  const message = [error.message ?? copy.message, reset].filter(Boolean).join(' ');

  return (
    <Alert
      severity={copy.severity}
      icon={ICONS[error.kind]}
      variant={variant === 'inline' ? 'outlined' : 'standard'}
      sx={variant === 'inline' ? { py: 0.25, alignItems: 'center' } : { my: 2 }}
      action={
        action ??
        (onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null)
      }
    >
      {variant === 'block' ? <AlertTitle>{copy.title}</AlertTitle> : null}
      {variant === 'block' ? message : (error.message ?? copy.title)}
    </Alert>
  );
}
