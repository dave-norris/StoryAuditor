'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { PricingTable } from '@clerk/billing/react';

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

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>User Information</h3>
        <div style={{ display: 'grid', gap: '0.5rem', color: '#666' }}>
          <p><strong>User ID:</strong> <code style={{ backgroundColor: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>{user?.id}</code></p>
          <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
          <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
          <p><strong>Created:</strong> {user?.createdAt?.toLocaleDateString()}</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Subscription & Billing</h3>
        <PricingTable />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p style={{ color: '#666' }}>Manuscript management features coming soon...</p>
      </div>
    </div>
  );
}
