'use client';

import { UserButton, useUser } from '@clerk/nextjs';

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="container"><p>Loading...</p></div>;
  }

  const handleSubscribe = () => {
    if (user?.id) {
      // Link to Clerk's billing portal for this user
      window.location.href = `https://dashboard.clerk.com/apps/~/billing/checkout?user_id=${user.id}&plan_id=pro`;
    }
  };

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

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#92400e' }}>Subscription & Billing</h3>
        <p style={{ color: '#92400e', marginBottom: '1.5rem' }}>
          Unlock full access to StoryAuditor with a professional subscription.
        </p>
        <div style={{ maxWidth: '400px', border: '2px solid #f59e0b', padding: '2rem', borderRadius: '8px', backgroundColor: '#fffbeb', textAlign: 'center' }}>
          <h4 style={{ color: '#92400e', fontSize: '1.5rem', marginBottom: '0.5rem' }}>StoryAuditor Pro</h4>
          <p style={{ color: '#92400e', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>$19.00<span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>/month</span></p>
          <ul style={{ color: '#92400e', fontSize: '0.95rem', marginBottom: '1.5rem', listStyle: 'none', padding: 0, textAlign: 'left' }}>
            <li style={{ marginBottom: '0.5rem' }}>✓ Unlimited manuscript audits</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Comprehensive feedback & analysis</li>
            <li style={{ marginBottom: '0.5rem' }}>✓ Priority support</li>
            <li>✓ Access to all features</li>
          </ul>
          <button 
            onClick={handleSubscribe}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Subscribe Now
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <p style={{ color: '#666' }}>Manuscript management features coming soon...</p>
      </div>
    </div>
  );
}
