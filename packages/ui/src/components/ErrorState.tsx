import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import type { ReactNode } from 'react';

/** How loud the failure is. Picks the colour and the icon — nothing else. */
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorStateProps {
  title: string;
  message?: ReactNode | undefined;
  severity?: ErrorSeverity | undefined;
  /** Omit to hide the button. Whether a failure is worth retrying is the app's call. */
  onRetry?: (() => void) | undefined;
  retryLabel?: string | undefined;
  /** `'inline'` is the strip inside a card; `'block'` is the full-width page state. */
  variant?: 'inline' | 'block' | undefined;
  /** Replaces the retry button entirely — a link to the detail page, say. */
  action?: ReactNode | undefined;
}

const ICONS: Record<ErrorSeverity, ReactNode> = {
  error: <ErrorOutlineIcon fontSize="inherit" />,
  warning: <WarningAmberIcon fontSize="inherit" />,
  info: <InfoOutlinedIcon fontSize="inherit" />,
};

/**
 * A rendered failure.
 *
 * Takes finished copy rather than an error type. The design system has no idea what a
 * rate limit is, and a table of GitHub-specific messages living here would make the
 * package unusable for any other data source — so the words come from the caller, which
 * is the only layer that knows what went wrong and what the user can do about it.
 */
export function ErrorState({
  title,
  message,
  severity = 'error',
  onRetry,
  retryLabel = 'Retry',
  variant = 'block',
  action,
}: ErrorStateProps) {
  return (
    <Alert
      severity={severity}
      icon={ICONS[severity]}
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
      {variant === 'block' ? <AlertTitle>{title}</AlertTitle> : null}
      {variant === 'block' ? message : (message ?? title)}
    </Alert>
  );
}
