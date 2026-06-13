'use client';

import type { DashboardItem } from '@/lib/queries/dashboard/getItems';
import { ItemCardMenu } from './ItemCardMenu';
import styles from './ItemCard.module.css';

interface ItemCardProps {
  item: DashboardItem;
  onArchive: () => void;
  onDelete: () => void;
  onToggleType?: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTypeBadge(type: DashboardItem['type']): string {
  switch (type) {
    case 'series':
      return 'Series';
    case 'group':
      return 'Group';
    case 'standalone_book':
      return 'Book';
  }
}

export function ItemCard({ item, onArchive, onDelete, onToggleType }: ItemCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{item.title}</h3>
          <span className={styles.badge}>{getTypeBadge(item.type)}</span>
        </div>
        <div className={styles.meta}>
          <time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time>
          {item.bookCount > 0 && (
            <span className={styles.bookCount}>
              {item.bookCount} {item.bookCount === 1 ? 'book' : 'books'}
            </span>
          )}
        </div>
      </div>
      <ItemCardMenu
        item={item}
        onArchive={onArchive}
        onDelete={onDelete}
        onToggleType={onToggleType}
      />
    </article>
  );
}
