/**
 * Unit test for Nav component "Open App" link
 *
 * Asserts that the Nav component renders a link with href="/app"
 * and descriptive text "Open App".
 *
 * Validates: Requirements 4.3, 4.4
 */

import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

// Mock lucide-react icons used by Nav
vi.mock('lucide-react', () => ({
  BookOpen: ({ size, ...props }: { size?: number }) =>
    React.createElement('svg', { 'data-testid': 'icon-book-open', ...props }),
}));

// Mock ThemeToggle (client component using next-themes)
vi.mock('../ThemeToggle', () => ({
  ThemeToggle: () => React.createElement('div', { 'data-testid': 'theme-toggle' }),
}));

// Mock MobileMenu (client component using useState)
vi.mock('../MobileMenu', () => ({
  MobileMenu: () => React.createElement('div', { 'data-testid': 'mobile-menu' }),
}));

import { Nav } from '../Nav';

describe('Nav - "Open App" link (Req 4.3, 4.4)', () => {
  it('renders a link with href="/app"', () => {
    const html = renderToString(React.createElement(Nav));
    expect(html).toMatch(/<a[^>]*href="\/app"[^>]*>/);
  });

  it('renders the link with descriptive text "Open App"', () => {
    const html = renderToString(React.createElement(Nav));
    // Match an anchor with href="/app" containing text "Open App"
    const linkMatch = html.match(/<a[^>]*href="\/app"[^>]*>([^<]+)<\/a>/);
    expect(linkMatch).not.toBeNull();
    expect(linkMatch![1].trim()).toBe('Open App');
  });
});
