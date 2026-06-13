'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function SettingsPage() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/dashboard/settings');
        if (res.ok) {
          const data = await res.json();
          setValue(String(data.maxDashboardItems));
        }
      } catch {
        // Use default empty value on fetch failure
      } finally {
        setIsFetching(false);
      }
    }
    fetchSettings();
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.back(), 5000);
    return () => clearTimeout(timer);
  }, [success, router]);

  function validate(input: string): string | null {
    const num = Number(input);
    if (input.trim() === '' || isNaN(num)) {
      return 'Value must be an integer between 5 and 50';
    }
    if (!Number.isInteger(num)) {
      return 'Value must be an integer between 5 and 50';
    }
    if (num < 5 || num > 50) {
      return 'Value must be an integer between 5 and 50';
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDashboardItems: Number(value) }),
      });

      if (res.ok) {
        const data = await res.json();
        setValue(String(data.maxDashboardItems));
        setSuccess('Settings saved successfully');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <main className={styles.container}>
        <h1 className={styles.heading}>Dashboard Settings</h1>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>Dashboard Settings</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="maxDashboardItems">
            Items per page (5–50)
          </label>
          <input
            id="maxDashboardItems"
            className={styles.input}
            type="number"
            min={5}
            max={50}
            step={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            disabled={isLoading}
            aria-describedby={error ? 'settings-error' : undefined}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p id="settings-error" className={styles.error} role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className={styles.success} role="status">
              {success}
            </p>
          )}
        </div>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </main>
  );
}
