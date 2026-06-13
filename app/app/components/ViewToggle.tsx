'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './ViewToggle.module.css';

interface ViewToggleProps {
  currentView: 'active' | 'archived';
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSwitch(view: 'active' | 'archived') {
    if (view === currentView) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className={styles.tabBar} role="tablist" aria-label="Dashboard view">
      <button
        className={`${styles.tab} ${currentView === 'active' ? styles.active : ''}`}
        role="tab"
        aria-selected={currentView === 'active'}
        onClick={() => handleSwitch('active')}
        type="button"
      >
        Active
      </button>
      <button
        className={`${styles.tab} ${currentView === 'archived' ? styles.active : ''}`}
        role="tab"
        aria-selected={currentView === 'archived'}
        onClick={() => handleSwitch('archived')}
        type="button"
      >
        Archived
      </button>
    </div>
  );
}
