'use client';

import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export function AuthHeader() {
  const { isSignedIn } = useUser();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <h1>StoryAuditor</h1>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {!isSignedIn ? (
          <>
            <SignInButton mode="modal">
              <button className="button">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="button">Sign Up</button>
            </SignUpButton>
          </>
        ) : (
          <>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="button">Dashboard</button>
            </Link>
            <UserButton />
          </>
        )}
      </div>
    </div>
  );
}
