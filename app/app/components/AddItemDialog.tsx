'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './AddItemDialog.module.css';

export interface AddItemDialogProps {
  open: boolean;
  title: string;
  fieldLabel: string;
  fieldMaxLength: number;
  onSave: (value: string) => void;
  onClose: () => void;
  keepOpenOnSave?: boolean;
}

export function AddItemDialog({
  open,
  title,
  fieldLabel,
  fieldMaxLength,
  onSave,
  onClose,
  keepOpenOnSave = false,
}: AddItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const prevOpenRef = useRef(false);

  // Show/close dialog based on open prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  // Reset field and validation when dialog opens (open transitions from false to true)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setFieldValue('');
      setValidationError(null);
      // Auto-focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Handle Escape key via native cancel event
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // Handle backdrop click via rect-based detection
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const clickedInDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!clickedInDialog) {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSave = () => {
    const trimmed = fieldValue.trim();
    if (trimmed.length === 0) {
      setValidationError(`${fieldLabel} is required`);
      return;
    }

    onSave(trimmed);

    if (keepOpenOnSave) {
      setFieldValue('');
      setValidationError(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (typeof window === 'undefined') return null;

  const titleId = `add-item-dialog-title`;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleBackdropClick}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="add-item-field">
          {fieldLabel}
        </label>
        <input
          ref={inputRef}
          id="add-item-field"
          type="text"
          className={`${styles.input}${validationError ? ` ${styles.inputError}` : ''}`}
          value={fieldValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={fieldMaxLength}
          autoComplete="off"
        />
        {validationError && (
          <p className={styles.error} role="alert">
            {validationError}
          </p>
        )}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.cancelBtn}`}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.saveBtn}`}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </dialog>,
    document.body
  );
}
