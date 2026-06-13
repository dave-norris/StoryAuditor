'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TrashItem } from '@/lib/queries/dashboard/getTrashItems';
import type { ModalAction } from '@/app/app/components/ConfirmationModal';
import { TrashItemCard } from './components/TrashItemCard';
import { ShowMoreButton } from '@/app/app/components/ShowMoreButton';
import { EmptyState } from '@/app/app/components/EmptyState';
import { ConfirmationModal } from '@/app/app/components/ConfirmationModal';
import styles from './page.module.css';

interface ModalState {
  open: boolean;
  title: string;
  body: string;
  actions: ModalAction[];
  isLoading: boolean;
}

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const fetchTrashItems = useCallback(async (cursor?: string | null) => {
    const params = new URLSearchParams();
    if (cursor) {
      params.set('cursor', cursor);
    }
    const url = `/api/trash/items${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to load trash items');
    }
    return res.json();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchTrashItems();
        if (!cancelled) {
          setItems(data.items);
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load trash items. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [fetchTrashItems]);

  async function handleShowMore() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchTrashItems(nextCursor);
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setError('Failed to load more items.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  function closeModal() {
    setModalState(null);
  }

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  }

  function handleRestore(item: TrashItem) {
    if (item.type === 'series' || item.type === 'group') {
      // Series/group: show modal asking whether to also restore contained books
      setModalState({
        open: true,
        title: `Restore "${item.title}"?`,
        body: 'Would you also like to restore contained books that are in the trash?',
        isLoading: false,
        actions: [
          { label: 'Cancel', variant: 'secondary', onClick: closeModal },
          {
            label: 'Container only',
            variant: 'primary',
            onClick: () => confirmRestoreSeries(item, false),
          },
          {
            label: 'Restore all',
            variant: 'primary',
            onClick: () => confirmRestoreSeries(item, true),
          },
        ],
      });
    } else {
      // Standalone or contained book: restore directly
      confirmRestoreBook(item);
    }
  }

  async function confirmRestoreBook(item: TrashItem) {
    try {
      const res = await fetch(`/api/trash/items/${item.id}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: item.source }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to restore item.');
        return;
      }
      setItems((prev) => prev.filter((i) => !(i.id === item.id && i.source === item.source)));
      setError(null);
    } catch {
      setError('Network error. Please try again.');
    }
  }

  async function confirmRestoreSeries(item: TrashItem, includeBooks: boolean) {
    setModalState((prev) => prev ? { ...prev, isLoading: true } : prev);
    try {
      const res = await fetch(`/api/trash/items/${item.id}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: item.source, includeBooks }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to restore item.');
        closeModal();
        return;
      }
      // Remove the restored item from the list
      setItems((prev) => prev.filter((i) => !(i.id === item.id && i.source === item.source)));
      // If includeBooks, also remove contained books that belong to this series
      if (includeBooks) {
        // Re-fetch to get accurate state after bulk restore
        try {
          const data = await fetchTrashItems();
          setItems(data.items);
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
        } catch {
          // Items list may be slightly stale, but that's acceptable
        }
      }
      setError(null);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      closeModal();
    }
  }

  function handleEmptyTrash() {
    const count = items.length;
    setModalState({
      open: true,
      title: 'Empty Trash?',
      body: `Permanently delete ${count} ${count === 1 ? 'item' : 'items'}? This cannot be undone.`,
      isLoading: false,
      actions: [
        { label: 'Cancel', variant: 'secondary', onClick: closeModal },
        {
          label: 'Permanently Delete',
          variant: 'danger',
          onClick: confirmEmptyTrash,
        },
      ],
    });
  }

  async function confirmEmptyTrash() {
    setModalState((prev) => prev ? { ...prev, isLoading: true } : prev);
    try {
      const res = await fetch('/api/trash/empty', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to empty trash.');
        closeModal();
        return;
      }
      const data = await res.json();
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setError(null);
      showSuccess(
        `${data.permanentlyDeleted} ${data.permanentlyDeleted === 1 ? 'item' : 'items'} permanently deleted.`
      );
    } catch {
      setError('Network error. Please try again.');
    } finally {
      closeModal();
    }
  }

  function dismissError() {
    setError(null);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Trash</h1>
        {items.length > 0 && (
          <button
            type="button"
            className={styles.emptyTrashBtn}
            onClick={handleEmptyTrash}
          >
            Empty Trash
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span className={styles.errorMessage}>{error}</span>
          <button
            type="button"
            className={styles.errorDismiss}
            onClick={dismissError}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className={styles.success} role="status">
          {successMessage}
        </div>
      )}

      {!isLoading && items.length === 0 && !successMessage && (
        <EmptyState message="Trash is empty." />
      )}

      {items.length > 0 && (
        <div className={styles.cardList}>
          {items.map((item) => (
            <TrashItemCard
              key={`${item.source}-${item.id}`}
              item={item}
              onRestore={() => handleRestore(item)}
            />
          ))}
        </div>
      )}

      <ShowMoreButton
        hasMore={hasMore}
        isLoading={isLoadingMore}
        onClick={handleShowMore}
      />

      {modalState && (
        <ConfirmationModal
          open={modalState.open}
          title={modalState.title}
          body={modalState.body}
          actions={modalState.actions}
          onClose={closeModal}
          isLoading={modalState.isLoading}
        />
      )}
    </div>
  );
}
