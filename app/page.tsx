'use client';

import { useState } from 'react';
import { DatabaseStatus } from './components/DatabaseStatus';
import { SignUpForm } from './components/SignUpForm';

export default function Home() {
  const [showSignUpForm, setShowSignUpForm] = useState(false);

  return (
    <div className="container">
      <h1>Welcome to StoryAuditor</h1>
      <p>Built with <strong>Next.js</strong> - The React Framework for Production</p>
      <p>Next.js provides a powerful foundation with server-side rendering, static generation, API routes, and built-in optimization. Combined with PostgreSQL for reliable data storage, you have everything you need to build modern web applications.</p>
      <p>Experience fast performance, excellent developer experience, and production-ready features out of the box.</p>
      <button className="button">Explore Next.js</button>
      
      <button 
        className="button"
        onClick={() => setShowSignUpForm(!showSignUpForm)}
      >
        {showSignUpForm ? 'Hide Sign Up' : 'Sign Up'}
      </button>

      {showSignUpForm && (
        <div className="signup-form-container">
          <SignUpForm 
            onSuccess={(email) => {
              alert(`Successfully signed up with ${email}!`);
              setShowSignUpForm(false);
            }}
            onError={(error) => {
              console.error('Sign up error:', error);
            }}
          />
        </div>
      )}
      
      <DatabaseStatus />
    </div>
  );
}
