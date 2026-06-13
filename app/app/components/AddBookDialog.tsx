'use client';

import { AddItemDialog } from './AddItemDialog';

export interface AddBookDialogProps {
  open: boolean;
  onSave: (title: string) => void;
  onClose: () => void;
}

export function AddBookDialog({ open, onSave, onClose }: AddBookDialogProps) {
  return (
    <AddItemDialog
      open={open}
      title="Add Book"
      fieldLabel="Book title"
      fieldMaxLength={200}
      keepOpenOnSave={false}
      onSave={onSave}
      onClose={onClose}
    />
  );
}
