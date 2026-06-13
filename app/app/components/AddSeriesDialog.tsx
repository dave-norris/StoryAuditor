'use client';

import { AddItemDialog } from './AddItemDialog';

export interface AddSeriesDialogProps {
  open: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function AddSeriesDialog({ open, onSave, onClose }: AddSeriesDialogProps) {
  return (
    <AddItemDialog
      open={open}
      title="Add Series"
      fieldLabel="Series name"
      fieldMaxLength={100}
      keepOpenOnSave={false}
      onSave={onSave}
      onClose={onClose}
    />
  );
}
