import type { ReactNode } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode | undefined;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  /** Paints the confirm button red. Untracking drops the local snapshot with it. */
  destructive?: boolean | undefined;
  /** Keeps the dialog open with a spinner while the caller's action resolves. */
  busy?: boolean | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic "are you sure?".
 *
 * Owns no state: the caller holds `open` and both handlers, so the dialog has no idea what
 * it is confirming. That is what keeps it in `@gh/ui` instead of in a feature folder.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? 'confirm-dialog-description' : undefined}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      {description ? (
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">{description}</DialogContentText>
        </DialogContent>
      ) : null}
      <DialogActions>
        <Button onClick={onCancel} disabled={busy ?? false} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={busy ?? false}
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          autoFocus
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
