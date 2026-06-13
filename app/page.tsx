import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StoryAuditor — Coming Soon',
  description: 'StoryAuditor is coming soon.',
};

export default function Home() {
  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ fontSize: '1.5rem' }}>Coming soon...</p>
    </main>
  );
}
