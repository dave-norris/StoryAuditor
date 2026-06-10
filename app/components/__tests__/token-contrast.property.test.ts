// Feature: landing-page, Property 5: Design token contrast ratios meet WCAG AA
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Property-Based Test: Design token contrast ratios meet WCAG AA
 *
 * For each text-on-background token pairing (--ink on --bg, --ink on --surface,
 * --ink-muted on --bg, --ink-muted on --surface, --brand on --bg, --brand-strong on --bg)
 * in both the paper and night themes, the computed contrast ratio SHALL be at least 4.5:1.
 *
 * **Validates: Requirements 9.8, 12.1**
 */

// --- Helpers ---

/**
 * Parse hex color string to sRGB values in 0-1 range.
 */
function hexToSRGB(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Linearize an sRGB channel value per WCAG 2.1 formula.
 */
function linearize(value: number): number {
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * Compute relative luminance per WCAG 2.1.
 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToSRGB(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Compute contrast ratio between two colors.
 * Returns ratio as L1/L2 where L1 >= L2.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse tokens.css and extract token values per theme.
 */
function parseTokens(): Record<string, Record<string, string>> {
  const cssPath = resolve(__dirname, '../../tokens.css');
  const css = readFileSync(cssPath, 'utf-8');

  const themes: Record<string, Record<string, string>> = {};
  const themeRegex = /\[data-theme="(\w+)"\]\s*\{([^}]+)\}/g;

  let match: RegExpExecArray | null;
  while ((match = themeRegex.exec(css)) !== null) {
    const themeName = match[1];
    const block = match[2];
    const tokens: Record<string, string> = {};

    const tokenRegex = /--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g;
    let tokenMatch: RegExpExecArray | null;
    while ((tokenMatch = tokenRegex.exec(block)) !== null) {
      tokens[`--${tokenMatch[1]}`] = tokenMatch[2];
    }
    themes[themeName] = tokens;
  }

  return themes;
}

// --- Test Data ---

const TEXT_ON_BACKGROUND_PAIRINGS = [
  { foreground: '--ink', background: '--bg', label: '--ink on --bg' },
  { foreground: '--ink', background: '--surface', label: '--ink on --surface' },
  { foreground: '--ink-muted', background: '--bg', label: '--ink-muted on --bg' },
  { foreground: '--ink-muted', background: '--surface', label: '--ink-muted on --surface' },
  { foreground: '--brand', background: '--bg', label: '--brand on --bg' },
  { foreground: '--brand-strong', background: '--bg', label: '--brand-strong on --bg' },
] as const;

const THEME_NAMES = ['paper', 'night'] as const;

// --- Tests ---

describe('Property 5: Design token contrast ratios meet WCAG AA', () => {
  const themes = parseTokens();

  it('should have both paper and night themes parsed from tokens.css', () => {
    expect(themes.paper).toBeDefined();
    expect(themes.night).toBeDefined();
  });

  it('all text-on-background pairings meet ≥ 4.5:1 contrast ratio in both themes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...THEME_NAMES),
        fc.constantFrom(...TEXT_ON_BACKGROUND_PAIRINGS),
        (themeName, pairing) => {
          const themeTokens = themes[themeName];
          const fgHex = themeTokens[pairing.foreground];
          const bgHex = themeTokens[pairing.background];

          expect(fgHex).toBeDefined();
          expect(bgHex).toBeDefined();

          const ratio = contrastRatio(fgHex, bgHex);

          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
