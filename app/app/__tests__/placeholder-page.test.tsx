/**
 * Unit tests for the /app placeholder page
 *
 * Tests that the placeholder page renders the expected heading,
 * status text, Clerk UserButton, and navigation links.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 4.1, 4.2, 4.4
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

// Mock @clerk/nextjs to provide a stub UserButton
vi.mock('@clerk/nextjs', () => ({
  UserButton: () => React.createElement('div', { 'data-testid': 'clerk-user-button' }),
}));

// Mock next/link to render a standard anchor tag
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

import AppPage from '../page';

describe('Placeholder Page - Heading (Req 2.1)', () => {
  it('renders an <h1> element with text "StoryAuditor"', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html).toMatch(/<h1[^>]*>StoryAuditor<\/h1>/);
  });
});

describe('Placeholder Page - Status Text (Req 2.2)', () => {
  it('renders text containing "under construction"', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html.toLowerCase()).toContain('under construction');
  });
});

describe('Placeholder Page - UserButton (Req 2.3)', () => {
  it('renders the Clerk UserButton component', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html).toContain('data-testid="clerk-user-button"');
  });
});

describe('Placeholder Page - Navigation Links (Req 4.1, 4.2, 4.4)', () => {
  it('has a link to "/" with descriptive text', () => {
    const html = renderToString(React.createElement(AppPage));
    // Should contain an anchor pointing to "/"
    expect(html).toMatch(/<a[^>]*href="\/"/);
    // The link text should be descriptive (not empty)
    const homeLinkMatch = html.match(/<a[^>]*href="\/"[^>]*>([^<]+)<\/a>/);
    expect(homeLinkMatch).not.toBeNull();
    expect(homeLinkMatch![1].trim().length).toBeGreaterThan(0);
  });

  it('has a link to "/dashboard" with descriptive text', () => {
    const html = renderToString(React.createElement(AppPage));
    // Should contain an anchor pointing to "/dashboard"
    expect(html).toMatch(/<a[^>]*href="\/dashboard"/);
    // The link text should be descriptive (not empty)
    const dashLinkMatch = html.match(/<a[^>]*href="\/dashboard"[^>]*>([^<]+)<\/a>/);
    expect(dashLinkMatch).not.toBeNull();
    expect(dashLinkMatch![1].trim().length).toBeGreaterThan(0);
  });
});
