// Feature: landing-page, Property 4: No hard-coded color literals in component styles
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Property-Based Test: No hard-coded color literals in component styles
 *
 * For any CSS Module file in the landing components directory, the file content
 * SHALL contain zero occurrences of hard-coded color literals (hex codes matching
 * #[0-9a-fA-F]{3,8}, rgb()/rgba() functions, hsl()/hsla() functions, or CSS named
 * colors used as property values).
 *
 * Exclusions: "transparent", "inherit", "currentColor" are NOT color literals.
 * Hex codes inside var() references or CSS comments are excluded.
 *
 * **Validates: Requirements 9.5, 15.2**
 */

const LANDING_DIR = path.resolve(__dirname, '../landing');

// CSS named colors that should not appear as property values
// (subset of common ones likely to be used in a landing page)
const CSS_NAMED_COLORS = [
  'white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'aqua', 'maroon', 'olive', 'silver', 'fuchsia', 'indigo',
  'violet', 'coral', 'salmon', 'tomato', 'gold', 'wheat', 'khaki',
  'crimson', 'darkblue', 'darkgreen', 'darkred', 'lightblue', 'lightgreen',
  'lightgray', 'lightgrey', 'darkgray', 'darkgrey', 'aliceblue', 'antiquewhite',
  'beige', 'bisque', 'blanchedalmond', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'cornflowerblue', 'cornsilk', 'darkcyan', 'darkgoldenrod',
  'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid',
  'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkslategrey',
  'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'gainsboro',
  'ghostwhite', 'goldenrod', 'greenyellow', 'honeydew', 'hotpink', 'indianred',
  'ivory', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon',
  'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightpink', 'lightsalmon',
  'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
  'lightsteelblue', 'lightyellow', 'limegreen', 'linen', 'mediumaquamarine',
  'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
  'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
  'oldlace', 'olivedrab', 'orangered', 'orchid', 'palegoldenrod', 'palegreen',
  'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru',
  'plum', 'powderblue', 'rosybrown', 'royalblue', 'saddlebrown', 'sandybrown',
  'seagreen', 'seashell', 'sienna', 'skyblue', 'slateblue', 'slategray',
  'slategrey', 'snow', 'springgreen', 'steelblue', 'tan', 'thistle',
  'turquoise', 'whitesmoke', 'yellowgreen',
];

// Values that look like named colors but are allowed
const ALLOWED_KEYWORDS = ['transparent', 'inherit', 'currentcolor', 'initial', 'unset', 'none'];

function stripComments(css: string): string {
  // Remove CSS block comments /* ... */
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripVarReferences(css: string): string {
  // Remove var(...) contents so hex codes inside var references aren't flagged
  return css.replace(/var\([^)]*\)/g, 'var()');
}

function findHexColors(css: string): string[] {
  // Match hex color codes: #xxx, #xxxx, #xxxxxx, #xxxxxxxx
  // But NOT inside var() or after a word char (e.g., url fragments)
  const matches: string[] = [];
  const hexPattern = /(?<!\w)#[0-9a-fA-F]{3,8}\b/g;
  let match: RegExpExecArray | null;
  while ((match = hexPattern.exec(css)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

function findRgbHsl(css: string): string[] {
  // Match rgb(), rgba(), hsl(), hsla() function calls
  const matches: string[] = [];
  const pattern = /\b(rgba?|hsla?)\s*\(/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(css)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

function findNamedColors(css: string): string[] {
  // Find CSS named colors used as property values
  // Look for pattern: property: <value> where value is a named color
  const matches: string[] = [];
  // Split by lines and check property values
  const lines = css.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Match property declarations (e.g., "color: white;", "background: red;")
    const propMatch = trimmed.match(/^[\w-]+\s*:\s*(.+?)\s*;?\s*$/);
    if (propMatch) {
      const valueStr = propMatch[1];
      // Split value by spaces and check each token
      const tokens = valueStr.split(/[\s,/]+/);
      for (const token of tokens) {
        const lower = token.toLowerCase().replace(/[;!].*$/, '');
        if (
          CSS_NAMED_COLORS.includes(lower) &&
          !ALLOWED_KEYWORDS.includes(lower)
        ) {
          matches.push(token);
        }
      }
    }
  }
  return matches;
}

describe('Property 4: No hard-coded color literals in component styles', () => {
  const cssFiles = fs.readdirSync(LANDING_DIR)
    .filter((f) => f.endsWith('.module.css'))
    .map((f) => ({ name: f, path: path.join(LANDING_DIR, f) }));

  // Sanity check: we should have CSS module files to test
  it('should find CSS module files in the landing directory', () => {
    expect(cssFiles.length).toBeGreaterThan(0);
  });

  it.each(cssFiles)('$name should contain no hard-coded color literals', ({ name, path: filePath }) => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const cleaned = stripVarReferences(stripComments(raw));

    const hexMatches = findHexColors(cleaned);
    const rgbHslMatches = findRgbHsl(cleaned);
    const namedColorMatches = findNamedColors(cleaned);

    const allViolations = [
      ...hexMatches.map((m) => `hex: ${m}`),
      ...rgbHslMatches.map((m) => `function: ${m}`),
      ...namedColorMatches.map((m) => `named color: ${m}`),
    ];

    expect(
      allViolations,
      `${name} contains hard-coded color literals:\n  ${allViolations.join('\n  ')}`
    ).toHaveLength(0);
  });
});
