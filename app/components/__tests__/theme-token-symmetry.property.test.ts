// Feature: landing-page, Property 3: Theme token completeness and symmetry
// **Validates: Requirements 9.1, 9.2**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Parse theme CSS files and extract custom property names from each theme selector.
 * Returns a map of theme name -> set of token names.
 */
function parseThemeTokens(cssContent: string): Map<string, Set<string>> {
  const themes = new Map<string, Set<string>>();

  // Match [data-theme="<name>"] { ... } blocks
  const themeBlockRegex = /\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = themeBlockRegex.exec(cssContent)) !== null) {
    const themeName = match[1];
    const blockContent = match[2];

    const tokenNames = new Set<string>();
    // Match CSS custom property declarations: --token-name: value;
    const tokenRegex = /(--[\w-]+)\s*:/g;
    let tokenMatch: RegExpExecArray | null;

    while ((tokenMatch = tokenRegex.exec(blockContent)) !== null) {
      tokenNames.add(tokenMatch[1]);
    }

    themes.set(themeName, tokenNames);
  }

  return themes;
}

describe('Property 3: Theme token completeness and symmetry', () => {
  const paperPath = path.resolve(__dirname, '../../themes/paper.css');
  const nightPath = path.resolve(__dirname, '../../themes/night.css');
  const cssContent = fs.readFileSync(paperPath, 'utf-8') + '\n' + fs.readFileSync(nightPath, 'utf-8');
  const themes = parseThemeTokens(cssContent);

  const paperTokens = themes.get('paper');
  const nightTokens = themes.get('night');

  it('should have both paper and night themes defined', () => {
    expect(paperTokens).toBeDefined();
    expect(nightTokens).toBeDefined();
    expect(paperTokens!.size).toBeGreaterThan(0);
    expect(nightTokens!.size).toBeGreaterThan(0);
  });

  it('paper and night themes define exactly the same set of token names', () => {
    fc.assert(
      fc.property(
        // Generate an arbitrary token name from the paper theme set
        fc.constantFrom(...Array.from(paperTokens!)),
        (tokenName: string) => {
          // Every paper token must exist in night theme
          expect(nightTokens!.has(tokenName)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('night theme tokens are all present in paper theme', () => {
    fc.assert(
      fc.property(
        // Generate an arbitrary token name from the night theme set
        fc.constantFrom(...Array.from(nightTokens!)),
        (tokenName: string) => {
          // Every night token must exist in paper theme
          expect(paperTokens!.has(tokenName)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('both themes have identical token count', () => {
    expect(paperTokens!.size).toBe(nightTokens!.size);
  });

  it('both themes define exactly the same set (set equality)', () => {
    const paperArray = Array.from(paperTokens!).sort();
    const nightArray = Array.from(nightTokens!).sort();
    expect(paperArray).toEqual(nightArray);
  });
});
