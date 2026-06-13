'use client';

import { AddItemDialog } from './AddItemDialog';

export interface AddGroupDialogProps {
  open: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function AddGroupDialog({ open, onSave, onClose }: AddGroupDialogProps) {
  return (
    <AddItemDialog
      open={open}
      title="Add Group"
      fieldLabel="Group name"
      fieldMaxLength={50}
      keepOpenOnSave={true}
      onSave={onSave}
      onClose={onClose}
    />
  );
}
