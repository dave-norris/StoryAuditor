'use client';

import { useEffect, useRef, useState } from 'react';
import type { DashboardItem } from '@/lib/queries/dashboard/getItems';
import styles from './ItemCardMenu.module.css';

interface ItemCardMenuProps {
  item: DashboardItem;
  onArchive: () => void;
  onDelete: () => void;
  onToggleType?: () => void;
}

export function ItemCardMenu({ item, onArchive, onDelete, onToggleType }: ItemCardMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(action: () => void) {
    setOpen(false);
    action();
  }

  const isActiveContainer =
    item.source === 'series' && !item.archived;

  const typeToggleLabel =
    item.type === 'series' ? 'Switch to Group' : 'Switch to Series';

  return (
    <div className={styles.menuWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Item actions"
      >
        ⋮
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => handleSelect(onArchive)}
          >
            {item.archived ? 'Unarchive' : 'Archive'}
          </button>

          <button
            type="button"
            className={`${styles.menuItem} ${styles.danger}`}
            role="menuitem"
            onClick={() => handleSelect(onDelete)}
          >
            Delete
          </button>

          {isActiveContainer && onToggleType && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => handleSelect(onToggleType)}
            >
              {typeToggleLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
