'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import styles from './page.module.css';

export default function AppPage() {
  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>StoryAuditor</h1>
      <p className={styles.status}>This section is under construction.</p>
      <div className={styles.userButton}>
        <UserButton />
      </div>
      <nav className={styles.navLinks}>
        <Link href="/">Back to Home</Link>
      </nav>
    </main>
  );
}
