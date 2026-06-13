'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DashboardItem } from '@/lib/queries/dashboard/getItems';
import type { ModalAction } from './ConfirmationModal';
import { dashboardReducer, initialState } from './dashboardReducer';
import { ViewToggle } from './ViewToggle';
import { ItemCard } from './ItemCard';
import { ShowMoreButton } from './ShowMoreButton';
import { ConfirmationModal } from './ConfirmationModal';
import { EmptyState } from './EmptyState';
import styles from './DashboardView.module.css';

interface ModalState {
  open: boolean;
  title: string;
  body: string;
  actions: ModalAction[];
  isLoading: boolean;
}

export function DashboardView() {
  const searchParams = useSearchParams();
  const view = (searchParams.get('view') as 'active' | 'archived') || 'active';

  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchItems = useCallback(async (currentView: string, cursor?: string | null) => {
    const params = new URLSearchParams({ view: currentView });
    if (cursor) {
      params.set('cursor', cursor);
    }
    const res = await fetch(`/api/dashboard/items?${params.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to load items');
    }
    return res.json();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await fetchItems(view);
        if (!cancelled) {
          dispatch({ type: 'LOAD_SUCCESS', payload: data });
        }
      } catch {
        if (!cancelled) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load items. Please try again.' });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [view, fetchItems]);

  async function performAction(apiCall: () => Promise<Response>): Promise<boolean> {
    try {
      const res = await apiCall();
      if (!res.ok) {
        const body = await res.json();
        dispatch({ type: 'SET_ERROR', payload: body.error || 'Operation failed' });
        return false;
      }
      dispatch({ type: 'SET_ERROR', payload: null });
      return true;
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Network error. Please try again.' });
      return false;
    }
  }

  async function handleShowMore() {
    if (!state.nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchItems(view, state.nextCursor);
      dispatch({ type: 'APPEND_SUCCESS', payload: data });
    } catch {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more items.' });
    } finally {
      setIsLoadingMore(false);
    }
  }

  function closeModal() {
    setModalState(null);
  }

  function handleArchive(item: DashboardItem) {
    if (item.source === 'book') {
      // Standalone book: simple confirmation
      setModalState({
        open: true,
        title: item.archived ? `Unarchive "${item.title}"?` : `Archive "${item.title}"?`,
        body: item.archived
          ? 'This book will be moved back to your active dashboard.'
          : 'This book will be moved to your archived items.',
        isLoading: false,
        actions: [
          {
            label: 'Cancel',
            variant: 'secondary',
            onClick: closeModal,
          },
          {
            label: item.archived ? 'Unarchive' : 'Archive',
            variant: 'primary',
            onClick: () => confirmArchiveBook(item),
          },
        ],
      });
    } else {
      // Series or group: show book count and options
      const bookCount = item.bookCount;
      if (item.archived) {
        // Unarchive flow
        if (bookCount === 0) {
          // No contained books - just unarchive directly without modal (Req 6.6)
          confirmArchiveSeries(item, false);
          return;
        }
        setModalState({
          open: true,
          title: `Unarchive "${item.title}"?`,
          body: `This container has ${bookCount} ${bookCount === 1 ? 'book' : 'books'}. Unarchive all or container only?`,
          isLoading: false,
          actions: [
            { label: 'Cancel', variant: 'secondary', onClick: closeModal },
            { label: 'Container only', variant: 'primary', onClick: () => confirmArchiveSeries(item, false) },
            { label: 'Unarchive all', variant: 'primary', onClick: () => confirmArchiveSeries(item, true) },
          ],
        });
      } else {
        // Archive flow
        setModalState({
          open: true,
          title: `Archive "${item.title}"?`,
          body: bookCount > 0
            ? `This container has ${bookCount} ${bookCount === 1 ? 'book' : 'books'}. Archive all or container only?`
            : 'This container will be moved to your archived items.',
          isLoading: false,
          actions: bookCount > 0
            ? [
                { label: 'Cancel', variant: 'secondary', onClick: closeModal },
                { label: 'Container only', variant: 'primary', onClick: () => confirmArchiveSeries(item, false) },
                { label: 'Archive all', variant: 'primary', onClick: () => confirmArchiveSeries(item, true) },
              ]
            : [
                { label: 'Cancel', variant: 'secondary', onClick: closeModal },
                { label: 'Archive', variant: 'primary', onClick: () => confirmArchiveSeries(item, false) },
              ],
        });
      }
    }
  }

  async function confirmArchiveBook(item: DashboardItem) {
    setModalState((prev) => prev ? { ...prev, isLoading: true } : prev);
    const archive = !item.archived;
    const success = await performAction(() =>
      fetch(`/api/dashboard/items/${item.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: item.source, archive }),
      })
    );
    if (success) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id, source: item.source } });
    }
    closeModal();
  }

  async function confirmArchiveSeries(item: DashboardItem, includeBooks: boolean) {
    setModalState((prev) => prev ? { ...prev, isLoading: true } : prev);
    const archive = !item.archived;
    const success = await performAction(() =>
      fetch(`/api/dashboard/items/${item.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: item.source, archive, includeBooks }),
      })
    );
    if (success) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id, source: item.source } });
    }
    closeModal();
  }

  function handleDelete(item: DashboardItem) {
    if (item.source === 'book') {
      // Standalone book: simple confirmation
      setModalState({
        open: true,
        title: `Delete "${item.title}"?`,
        body: 'It will be moved to trash.',
        isLoading: false,
        actions: [
          { label: 'Cancel', variant: 'secondary', onClick: closeModal },
          { label: 'Delete', variant: 'danger', onClick: () => confirmDeleteBook(item) },
        ],
      });
    } else {
      // Series or group
      const bookCount = item.bookCount;
      setModalState({
        open: true,
        title: `Delete "${item.title}"?`,
        body: bookCount > 0
          ? `This container has ${bookCount} ${bookCount === 1 ? 'book' : 'books'}. Delete all or keep books?`
          : 'It will be moved to trash.',
        isLoading: false,
        actions: bookCount > 0
          ? [
              { label: 'Cancel', variant: 'secondary', onClick: closeModal },
              { label: 'Keep books', variant: 'primary', onClick: () => confirmDeleteSeries(item, 'keep_books') },
              { label: 'Delete all', variant: 'danger', onClick: () => confirmDeleteSeries(item, 'delete_all') },
            ]
          : [
              { label: 'Cancel', variant: 'secondary', onClick: closeModal },
              { label: 'Delete', variant: 'danger', onClick: () => confirmDeleteSeries(item, 'delete_all') },
            ],
      });
    }
  }

  async function confirmDeleteBook(item: DashboardItem) {
    setModalState((prev) => prev ? { ...prev, isLoading: true } : prev);
    const success = await performAction(() =>
      fetch(`/api/dashboard/items/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: item.source }),
      })
    );
    if (success) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id, source: item.source } });
    }
    closeModal();
  }

  async function confirmDeleteSeries(item: DashboardItem, mode: 'delete_all' | 'keep_books') {
    setModalState((prev) => prev ? { ...prev, isLoading: true } : prev);
    const success = await performAction(() =>
      fetch(`/api/dashboard/items/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: item.source, mode }),
      })
    );
    if (success) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id, source: item.source } });
    }
    closeModal();
  }

  async function handleToggleType(item: DashboardItem) {
    // No modal needed per Req 12.3
    const newType = item.type === 'series' ? 'group' : 'series';
    const success = await performAction(() =>
      fetch(`/api/dashboard/items/${item.id}/type`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newType }),
      })
    );
    if (success) {
      // Re-fetch current view to get updated item
      try {
        const data = await fetchItems(view);
        dispatch({ type: 'LOAD_SUCCESS', payload: data });
      } catch {
        // Silently ignore re-fetch failure; the toggle already succeeded
      }
    }
  }

  function dismissError() {
    dispatch({ type: 'SET_ERROR', payload: null });
  }

  // Determine empty state message
  const emptyMessage = view === 'active'
    ? 'No active items. Create a series, group, or book to get started.'
    : 'No archived items.';

  return (
    <div className={styles.container}>
      <ViewToggle currentView={view} />

      {state.error && (
        <div className={styles.error} role="alert">
          <span className={styles.errorMessage}>{state.error}</span>
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

      {!state.isLoading && state.items.length === 0 && (
        <EmptyState message={emptyMessage} />
      )}

      {state.items.length > 0 && (
        <div className={styles.cardList}>
          {state.items.map((item) => (
            <ItemCard
              key={`${item.source}-${item.id}`}
              item={item}
              onArchive={() => handleArchive(item)}
              onDelete={() => handleDelete(item)}
              onToggleType={
                item.source === 'series' && !item.archived
                  ? () => handleToggleType(item)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <ShowMoreButton
        hasMore={state.hasMore}
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
