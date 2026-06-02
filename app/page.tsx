'use client';

import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs';
import { DatabaseStatus } from './components/DatabaseStatus';

export default function Home() {
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Welcome to StoryAuditor</h1>
        <div>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="button">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="button" style={{ marginLeft: '0.5rem' }}>Sign Up</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>

      <p>Built with <strong>Next.js</strong> - The React Framework for Production</p>
      <p>Next.js provides a powerful foundation with server-side rendering, static generation, API routes, and built-in optimization. Combined with PostgreSQL for reliable data storage, you have everything you need to build modern web applications.</p>
      <p>Experience fast performance, excellent developer experience, and production-ready features out of the box.</p>
      <button className="button">Explore Next.js</button>
      
      <DatabaseStatus />
    </div>
  );
}
