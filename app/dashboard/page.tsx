'use client';

import { UserButton, useUser } from '@clerk/nextjs';

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <UserButton />
      </div>

      <div style={{
        padding: '2rem',
        backgroundColor: '#ecfdf5',
        border: '1px solid #10b981',
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h2 style={{ color: '#047857', marginBottom: '1rem' }}>Welcome to StoryAuditor! 🎉</h2>
        <p style={{ color: '#047857', fontSize: '1.1rem' }}>
          Hello {user?.firstName || 'Author'}! This is where the real app experience begins.
        </p>
        <p style={{ color: '#047857', marginTop: '1rem' }}>
          Upload your manuscript and start getting professional feedback.
        </p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p style={{ color: '#666' }}>Manuscript management features coming soon...</p>
      </div>
    </div>
  );
}
