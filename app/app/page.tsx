'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { CRAFT_AUDIT_CATEGORIES } from '../data/craftAuditData';
import { CraftAuditGrid } from '../components/app/CraftAuditGrid';
import styles from './page.module.css';

export default function AppPage() {
  const { user, isLoaded } = useUser();
  const ensuredRef = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !ensuredRef.current) {
      ensuredRef.current = true;
      fetch('/api/auth/ensure-user', { method: 'POST' }).catch((err) =>
        console.error('Failed to ensure user:', err)
      );
    }
  }, [isLoaded, user]);

  const greeting = user?.firstName ? `Welcome, ${user.firstName}` : 'StoryAuditor';

  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>{greeting}</h1>
      {user?.id && <p className={styles.userId}>ID: {user.id}</p>}
      <div className={styles.userButton}>
        <UserButton />
      </div>
      <CraftAuditGrid categories={CRAFT_AUDIT_CATEGORIES} />
      <nav className={styles.navLinks}>
        <Link href="/">Back to Home</Link>
      </nav>
    </main>
  );
}
