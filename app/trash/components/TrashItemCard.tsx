'use client';

import type { TrashItem } from '@/lib/queries/dashboard/getTrashItems';
import styles from './TrashItemCard.module.css';

interface TrashItemCardProps {
  item: TrashItem;
  onRestore: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTypeBadge(type: TrashItem['type']): string {
  switch (type) {
    case 'series':
      return 'Series';
    case 'group':
      return 'Group';
    case 'standalone_book':
      return 'Book';
    case 'contained_book':
      return 'Contained Book';
  }
}

export function TrashItemCard({ item, onRestore }: TrashItemCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{item.title}</h3>
          <span className={styles.badge}>{getTypeBadge(item.type)}</span>
        </div>
        <div className={styles.meta}>
          <time dateTime={item.deletedAt}>{formatDate(item.deletedAt)}</time>
        </div>
        <div className={styles.deletionInfo}>
          <span className={styles.reason}>{item.deletedReasonLabel}</span>
        </div>
      </div>
      <button
        type="button"
        className={styles.restoreButton}
        onClick={onRestore}
        aria-label={`Restore ${item.title}`}
      >
        Restore
      </button>
    </article>
  );
}
