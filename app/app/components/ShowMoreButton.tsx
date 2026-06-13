'use client';

import styles from './ShowMoreButton.module.css';

interface ShowMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function ShowMoreButton({ hasMore, isLoading, onClick }: ShowMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={onClick}
        disabled={isLoading}
        type="button"
      >
        {isLoading ? (
          <span className={styles.loading} aria-label="Loading more items">
            <span className={styles.spinner} aria-hidden="true" />
            Loading…
          </span>
        ) : (
          'Show More'
        )}
      </button>
    </div>
  );
}
