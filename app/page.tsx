import type { Metadata } from 'next';
import { Nav } from './components/landing/Nav';
import { Hero } from './components/landing/Hero';
import { StatStrip } from './components/landing/StatStrip';
import { FeatureGrid } from './components/landing/FeatureGrid';
import { HowItWorks } from './components/landing/HowItWorks';
import { PricingTiers } from './components/landing/PricingTiers';
import { Footer } from './components/landing/Footer';

export const metadata: Metadata = {
  title: 'StoryAuditor — AI Manuscript Analysis for Indie Authors',
  description:
    'Upload your novel and get a professional-grade hook report with chapter scores, pacing curves, and line-level polish flags. Free first chapter analysis.',
  openGraph: {
    title: 'StoryAuditor — AI Manuscript Analysis for Indie Authors',
    description: 'Upload your novel and get a professional-grade hook report.',
    type: 'website',
    url: 'https://storyauditor.com',
    images: [{ url: 'https://storyauditor.com/og-image.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://storyauditor.com',
  },
};

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <StatStrip />
        <FeatureGrid />
        <HowItWorks />
        <PricingTiers />
      </main>
      <Footer />
    </>
  );
}
