/**
 * ExplicitConfirmDialog Component
 * Plain language confirmations - no dark patterns
 */

'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

export interface ExplicitConfirmDialogProps {
  // TODO: Define props
  open?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ExplicitConfirmDialog(props: ExplicitConfirmDialogProps) {
  const {
    open = false,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
  } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
