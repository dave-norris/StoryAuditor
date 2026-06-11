/**
 * Integration tests for the /app page after Craft Audit Cards integration
 *
 * Validates: Requirements 1.3, 5.1, 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => React.createElement('div', { 'data-testid': 'clerk-user-button' }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

import AppPage from '../page';

describe('Page Integration - No placeholder text (Req 1.3)', () => {
  it('does NOT contain "under construction" text', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html.toLowerCase()).not.toContain('under construction');
  });
});

describe('Page Integration - Page heading (Req 7.3)', () => {
  it('renders an h1 with "StoryAuditor"', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html).toMatch(/<h1[^>]*>StoryAuditor<\/h1>/);
  });
});

describe('Page Integration - Section landmark (Req 5.1)', () => {
  it('renders a section with aria-label="Craft Audit Categories"', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html).toMatch(/<section[^>]*aria-label="Craft Audit Categories"/);
  });
});

describe('Page Integration - UserButton (Req 7.1)', () => {
  it('renders the Clerk UserButton component', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html).toContain('data-testid="clerk-user-button"');
  });
});

describe('Page Integration - Navigation link (Req 7.2)', () => {
  it('renders a link to "/" with "Back to Home" text', () => {
    const html = renderToString(React.createElement(AppPage));
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Back to Home<\/a>/);
  });
});

describe('Page Integration - Layout separation (Req 7.4)', () => {
  it('renders UserButton and nav link outside the section with aria-label="Craft Audit Categories"', () => {
    const html = renderToString(React.createElement(AppPage));

    // Extract the section content
    const sectionMatch = html.match(
      /<section[^>]*aria-label="Craft Audit Categories"[^>]*>([\s\S]*?)<\/section>/
    );
    expect(sectionMatch).not.toBeNull();
    const sectionContent = sectionMatch![1];

    // UserButton should NOT be inside the section
    expect(sectionContent).not.toContain('data-testid="clerk-user-button"');

    // The "Back to Home" link should NOT be inside the section
    expect(sectionContent).not.toContain('Back to Home');
  });
});
