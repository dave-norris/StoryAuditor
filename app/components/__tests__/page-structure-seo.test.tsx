/**
 * Unit tests for page structure and SEO metadata
 * Task 7.2: Verify page composition, section order, semantic landmarks,
 * SEO metadata, and heading hierarchy.
 *
 * Validates: Requirements 1.1, 1.2, 13.1, 13.2, 13.3, 13.4
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import Home, { metadata } from '../../page';

describe('Page Structure and Section Order (Req 1.1)', () => {
  it('renders 7 sections with correct data-section attributes in order', () => {
    const html = renderToString(React.createElement(Home));

    const expectedSections = [
      'nav',
      'hero',
      'stat-strip',
      'feature-grid',
      'how-it-works',
      'pricing-tiers',
      'footer',
    ];

    // Extract all data-section values in order of appearance
    const sectionMatches = [...html.matchAll(/data-section="([^"]+)"/g)];
    const foundSections = sectionMatches.map((m) => m[1]);

    expect(foundSections).toEqual(expectedSections);
  });

  it('renders exactly 7 data-section elements', () => {
    const html = renderToString(React.createElement(Home));
    const sectionMatches = [...html.matchAll(/data-section="([^"]+)"/g)];
    expect(sectionMatches).toHaveLength(7);
  });

  it('each data-section attribute has a unique value', () => {
    const html = renderToString(React.createElement(Home));
    const sectionMatches = [...html.matchAll(/data-section="([^"]+)"/g)];
    const values = sectionMatches.map((m) => m[1]);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe('Semantic Landmarks (Req 1.2)', () => {
  it('renders a <header> element for Nav', () => {
    const html = renderToString(React.createElement(Home));
    expect(html).toMatch(/<header[^>]*data-section="nav"/);
  });

  it('renders a <main> element wrapping Hero through PricingTiers', () => {
    const html = renderToString(React.createElement(Home));
    // main element should exist
    expect(html).toContain('<main');

    // main should contain the inner sections (hero through pricing-tiers)
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    expect(mainMatch).not.toBeNull();

    const mainContent = mainMatch![1];
    expect(mainContent).toContain('data-section="hero"');
    expect(mainContent).toContain('data-section="stat-strip"');
    expect(mainContent).toContain('data-section="feature-grid"');
    expect(mainContent).toContain('data-section="how-it-works"');
    expect(mainContent).toContain('data-section="pricing-tiers"');
  });

  it('<main> does NOT contain the nav or footer sections', () => {
    const html = renderToString(React.createElement(Home));
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    expect(mainMatch).not.toBeNull();

    const mainContent = mainMatch![1];
    expect(mainContent).not.toContain('data-section="nav"');
    expect(mainContent).not.toContain('data-section="footer"');
  });

  it('renders a <footer> element for Footer', () => {
    const html = renderToString(React.createElement(Home));
    expect(html).toMatch(/<footer[^>]*data-section="footer"/);
  });

  it('header appears before main, main appears before footer', () => {
    const html = renderToString(React.createElement(Home));
    const headerIdx = html.indexOf('<header');
    const mainIdx = html.indexOf('<main');
    const footerIdx = html.indexOf('<footer');

    expect(headerIdx).toBeGreaterThan(-1);
    expect(mainIdx).toBeGreaterThan(-1);
    expect(footerIdx).toBeGreaterThan(-1);
    expect(headerIdx).toBeLessThan(mainIdx);
    expect(mainIdx).toBeLessThan(footerIdx);
  });
});

describe('SEO Metadata - Title and Description (Req 13.1)', () => {
  it('metadata title is between 30 and 70 characters', () => {
    expect(metadata.title).toBeDefined();
    const title = String(metadata.title);
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(70);
  });

  it('metadata title contains a target keyword', () => {
    const title = String(metadata.title).toLowerCase();
    // Should contain keywords relevant to manuscript analysis / indie authors
    const hasKeyword =
      title.includes('manuscript') ||
      title.includes('analysis') ||
      title.includes('author') ||
      title.includes('novel') ||
      title.includes('storyauditor');
    expect(hasKeyword).toBe(true);
  });

  it('metadata description is between 80 and 180 characters', () => {
    expect(metadata.description).toBeDefined();
    const desc = String(metadata.description);
    expect(desc.length).toBeGreaterThanOrEqual(80);
    expect(desc.length).toBeLessThanOrEqual(180);
  });
});

describe('SEO Metadata - Open Graph Tags (Req 13.2)', () => {
  it('has og:title with a non-empty value', () => {
    expect(metadata.openGraph).toBeDefined();
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.title).toBeDefined();
    expect(String(og.title).length).toBeGreaterThan(0);
  });

  it('has og:description with a non-empty value', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.description).toBeDefined();
    expect(String(og.description).length).toBeGreaterThan(0);
  });

  it('has og:type set to "website"', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.type).toBe('website');
  });

  it('has og:url on storyauditor.com domain', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.url).toBeDefined();
    expect(String(og.url)).toContain('storyauditor.com');
  });

  it('has og:image with 1200x630 dimensions', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.images).toBeDefined();
    const images = og.images as Array<{ url: string; width: number; height: number }>;
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });
});

describe('SEO Metadata - Canonical Link (Req 13.3)', () => {
  it('has a canonical link set to an absolute URL on storyauditor.com', () => {
    expect(metadata.alternates).toBeDefined();
    const alternates = metadata.alternates as Record<string, unknown>;
    expect(alternates.canonical).toBeDefined();
    const canonical = String(alternates.canonical);
    expect(canonical).toMatch(/^https:\/\/storyauditor\.com/);
  });
});

describe('Heading Hierarchy (Req 13.4)', () => {
  it('contains exactly one <h1> element', () => {
    const html = renderToString(React.createElement(Home));
    const h1Matches = [...html.matchAll(/<h1[\s>]/g)];
    expect(h1Matches).toHaveLength(1);
  });

  it('does not skip heading levels (no h3 without preceding h2, etc.)', () => {
    const html = renderToString(React.createElement(Home));

    // Extract all heading levels in order
    const headingMatches = [...html.matchAll(/<h([1-6])[\s>]/g)];
    const levels = headingMatches.map((m) => parseInt(m[1], 10));

    expect(levels.length).toBeGreaterThan(0);
    expect(levels[0]).toBe(1); // First heading should be h1

    // Track the highest level seen so far to ensure no skipping
    let maxLevelSeen = 0;
    for (const level of levels) {
      // A heading level can only be at most 1 more than the max level seen
      // e.g., after h1, next can be h1 or h2 (not h3)
      // after h2, next can be h1, h2, or h3 (not h4)
      expect(level).toBeLessThanOrEqual(maxLevelSeen + 1);
      if (level > maxLevelSeen) {
        maxLevelSeen = level;
      }
    }
  });

  it('uses h2 for section headings after the h1', () => {
    const html = renderToString(React.createElement(Home));
    const headingMatches = [...html.matchAll(/<h([1-6])[\s>]/g)];
    const levels = headingMatches.map((m) => parseInt(m[1], 10));

    // There should be h2 headings for major sections
    expect(levels.filter((l) => l === 2).length).toBeGreaterThan(0);
  });
});
