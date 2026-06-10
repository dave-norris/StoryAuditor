/**
 * Unit tests for accessibility and responsive behavior
 * Task 9.3: Verify focus indicators, ARIA landmarks, ThemeToggle keyboard
 * operability and aria attributes, and decorative image handling.
 *
 * Validates: Requirements 12.2, 12.3, 12.4, 12.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';

// Mock next-themes before importing ThemeToggle
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'paper',
    setTheme: vi.fn(),
  }),
}));

import Home from '../../page';
import { ThemeToggle } from '../landing/ThemeToggle';
import { Nav } from '../landing/Nav';
import { Footer } from '../landing/Footer';
import { SampleReportCard } from '../landing/SampleReportCard';

const LANDING_CSS_DIR = path.resolve(__dirname, '../landing');

/**
 * Reads all CSS Module files from the landing components directory.
 */
function readAllCssModules(): { filename: string; content: string }[] {
  const files = fs.readdirSync(LANDING_CSS_DIR).filter((f) => f.endsWith('.module.css'));
  return files.map((filename) => ({
    filename,
    content: fs.readFileSync(path.join(LANDING_CSS_DIR, filename), 'utf-8'),
  }));
}

describe('Focus Indicators on Interactive Elements (Req 12.2)', () => {
  const cssFiles = readAllCssModules();

  it('all CSS modules with interactive elements include :focus-visible rules', () => {
    // CSS modules that contain interactive elements (links, buttons)
    const interactiveModules = [
      'Nav.module.css',
      'Hero.module.css',
      'ThemeToggle.module.css',
      'PricingCard.module.css',
    ];

    for (const moduleName of interactiveModules) {
      const cssFile = cssFiles.find((f) => f.filename === moduleName);
      expect(cssFile, `${moduleName} should exist`).toBeDefined();
      expect(cssFile!.content).toContain(':focus-visible');
    }
  });

  it('focus-visible rules use 2px outline width', () => {
    const interactiveModules = [
      'Nav.module.css',
      'Hero.module.css',
      'ThemeToggle.module.css',
      'PricingCard.module.css',
    ];

    for (const moduleName of interactiveModules) {
      const cssFile = cssFiles.find((f) => f.filename === moduleName);
      expect(cssFile, `${moduleName} should exist`).toBeDefined();

      // Extract all focus-visible blocks
      const focusBlocks = cssFile!.content.match(/\.[\w-]+:focus-visible\s*\{[^}]+\}/g);
      expect(focusBlocks, `${moduleName} should have :focus-visible blocks`).not.toBeNull();

      for (const block of focusBlocks!) {
        // Each focus-visible block should have outline with 2px
        expect(block).toMatch(/outline:\s*2px/);
      }
    }
  });

  it('focus outlines use a token-based color (not hard-coded)', () => {
    const interactiveModules = [
      'Nav.module.css',
      'Hero.module.css',
      'ThemeToggle.module.css',
      'PricingCard.module.css',
    ];

    for (const moduleName of interactiveModules) {
      const cssFile = cssFiles.find((f) => f.filename === moduleName);
      expect(cssFile, `${moduleName} should exist`).toBeDefined();

      const focusBlocks = cssFile!.content.match(/\.[\w-]+:focus-visible\s*\{[^}]+\}/g);
      expect(focusBlocks, `${moduleName} should have :focus-visible blocks`).not.toBeNull();

      for (const block of focusBlocks!) {
        // The outline color should reference a CSS custom property
        expect(block).toMatch(/outline:.*var\(--/);
      }
    }
  });
});

describe('ARIA Landmarks (Req 12.4)', () => {
  it('page has a banner landmark (header element)', () => {
    const html = renderToString(React.createElement(Home));
    expect(html).toMatch(/<header/);
  });

  it('page has exactly one main landmark', () => {
    const html = renderToString(React.createElement(Home));
    const mainMatches = [...html.matchAll(/<main[\s>]/g)];
    expect(mainMatches).toHaveLength(1);
  });

  it('page has a contentinfo landmark (footer element)', () => {
    const html = renderToString(React.createElement(Home));
    expect(html).toMatch(/<footer/);
  });

  it('Nav renders inside a <header> element', () => {
    const html = renderToString(React.createElement(Nav));
    expect(html).toMatch(/^<header/);
  });

  it('Footer renders inside a <footer> element', () => {
    const html = renderToString(React.createElement(Footer));
    expect(html).toMatch(/^<footer/);
  });

  it('landmarks appear in correct order: banner, main, contentinfo', () => {
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

describe('ThemeToggle Keyboard Operability and ARIA Attributes (Req 12.6)', () => {
  it('renders a group with aria-label "Theme switcher"', () => {
    const html = renderToString(React.createElement(ThemeToggle));
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Theme switcher"');
  });

  it('renders exactly 3 buttons for light, system, and dark states', () => {
    const html = renderToString(React.createElement(ThemeToggle));
    const buttonMatches = [...html.matchAll(/<button/g)];
    expect(buttonMatches).toHaveLength(3);
  });

  it('each button has a unique aria-label', () => {
    const html = renderToString(React.createElement(ThemeToggle));
    const ariaLabels = [...html.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
    // Filter to button labels (exclude the group-level "Theme switcher" label)
    const buttonLabels = ariaLabels.filter((l) => l !== 'Theme switcher');
    expect(buttonLabels.length).toBe(3);
    const uniqueLabels = new Set(buttonLabels);
    expect(uniqueLabels.size).toBe(3);
  });

  it('buttons have descriptive aria-label values (Light, System, Dark)', () => {
    const html = renderToString(React.createElement(ThemeToggle));
    expect(html).toMatch(/aria-label="[^"]*[Ll]ight/);
    expect(html).toMatch(/aria-label="[^"]*[Ss]ystem/);
    expect(html).toMatch(/aria-label="[^"]*[Dd]ark/);
  });

  it('mounted state renders aria-pressed attributes on buttons', () => {
    // The ThemeToggle uses a mounted check — the SSR placeholder omits aria-pressed
    // to avoid hydration mismatch. Verify the mounted branch in source has aria-pressed.
    const componentPath = path.resolve(__dirname, '../landing/ThemeToggle.tsx');
    const source = fs.readFileSync(componentPath, 'utf-8');
    // The mounted branch should include aria-pressed
    expect(source).toContain('aria-pressed={isActive}');
  });

  it('aria-pressed is a boolean reflecting active state', () => {
    // Verify the component source assigns aria-pressed based on isActive comparison
    const componentPath = path.resolve(__dirname, '../landing/ThemeToggle.tsx');
    const source = fs.readFileSync(componentPath, 'utf-8');
    // isActive is determined by comparing state === currentState
    expect(source).toMatch(/isActive\s*=.*state\s*===\s*currentState/);
    expect(source).toContain('aria-pressed');
  });

  it('all buttons have tabIndex=0 for keyboard navigation', () => {
    const html = renderToString(React.createElement(ThemeToggle));
    // All 3 buttons should be keyboard-focusable
    const tabIndexMatches = [...html.matchAll(/tabindex="0"/gi)];
    expect(tabIndexMatches.length).toBe(3);
  });

  it('all buttons have type="button" to prevent form submission', () => {
    const html = renderToString(React.createElement(ThemeToggle));
    const typeMatches = [...html.matchAll(/type="button"/g)];
    expect(typeMatches.length).toBe(3);
  });

  it('ThemeToggle has onKeyDown handler for Enter and Space activation', () => {
    // Verify the component source has keyboard event handling
    const componentPath = path.resolve(__dirname, '../landing/ThemeToggle.tsx');
    const source = fs.readFileSync(componentPath, 'utf-8');
    expect(source).toContain('onKeyDown');
    expect(source).toMatch(/e\.key\s*===\s*["']Enter["']/);
    expect(source).toMatch(/e\.key\s*===\s*["'] ["']/);
  });

  it('mounted state labels include "(active)" indicator for screen readers', () => {
    // The mounted branch appends "(active)" to the aria-label of the active button
    const componentPath = path.resolve(__dirname, '../landing/ThemeToggle.tsx');
    const source = fs.readFileSync(componentPath, 'utf-8');
    expect(source).toContain('(active)');
    // Verify the label dynamically appends active state
    expect(source).toMatch(/aria-label=.*isActive.*active/);
  });
});

describe('Decorative Images - aria-hidden (Req 12.3)', () => {
  it('SampleReportCard has aria-hidden="true"', () => {
    const html = renderToString(React.createElement(SampleReportCard));
    expect(html).toContain('aria-hidden="true"');
  });

  it('SampleReportCard root element is marked as decorative', () => {
    const html = renderToString(React.createElement(SampleReportCard));
    // The outermost div should have aria-hidden
    expect(html).toMatch(/^<div[^>]*aria-hidden="true"/);
  });

  it('SampleReportCard in full page context has aria-hidden="true"', () => {
    const html = renderToString(React.createElement(Home));
    // SampleReportCard should be present and decorated with aria-hidden
    expect(html).toContain('aria-hidden="true"');
  });
});
