'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmationModal.module.css';

export interface ModalAction {
  label: string;
  variant: 'primary' | 'danger' | 'secondary';
  onClick: () => void;
  disabled?: boolean;
}

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  body: string | React.ReactNode;
  actions: ModalAction[];
  onClose: () => void;
  isLoading?: boolean;
}

export function ConfirmationModal({
  open,
  title,
  body,
  actions,
  onClose,
  isLoading = false,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  if (typeof window === 'undefined') return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleBackdropClick}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-body"
    >
      <h2 id="confirmation-modal-title" className={styles.title}>
        {title}
      </h2>
      <div id="confirmation-modal-body" className={styles.body}>
        {body}
      </div>
      <div className={styles.actions}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`${styles.actionBtn} ${styles[action.variant]}`}
            onClick={action.onClick}
            disabled={action.disabled || isLoading}
          >
            {action.label}
          </button>
        ))}
      </div>
    </dialog>,
    document.body
  );
}
