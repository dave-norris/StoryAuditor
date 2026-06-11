'use client';

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { CRAFT_AUDIT_CATEGORIES } from '../data/craftAuditData';
import { CraftAuditGrid } from '../components/app/CraftAuditGrid';
import styles from './page.module.css';

export default function AppPage() {
  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>StoryAuditor</h1>
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
