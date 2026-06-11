// Feature: craft-audit-cards, Property 5: No color literals in card CSS
// Feature: craft-audit-cards, Property 6: Font sizes from typographic scale
// Feature: craft-audit-cards, Property 7: Design tokens exist in both themes
// **Validates: Requirements 4.1, 4.3, 4.4**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// --- Helpers ---

const CARD_CSS_PATH = path.resolve(__dirname, '../CraftAuditCard.module.css');
const GRID_CSS_PATH = path.resolve(__dirname, '../CraftAuditGrid.module.css');
const PAPER_CSS_PATH = path.resolve(__dirname, '../../../themes/paper.css');
const NIGHT_CSS_PATH = path.resolve(__dirname, '../../../themes/night.css');

/** CSS named colors that are not allowed as color values */
const CSS_NAMED_COLORS = [
  'white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'aqua', 'maroon', 'olive', 'silver', 'fuchsia', 'indigo',
  'violet', 'coral', 'salmon', 'tomato', 'gold', 'wheat', 'khaki',
  'crimson', 'darkblue', 'darkgreen', 'darkred', 'lightblue', 'lightgreen',
  'lightgray', 'lightgrey', 'darkgray', 'darkgrey',
];

/** Keywords that are allowed in color-related property values */
const ALLOWED_KEYWORDS = [
  'solid', 'none', 'transparent', 'inherit', 'initial', 'unset', 'currentcolor',
  'inset', 'auto', 'normal', 'revert',
];

/** Color-related CSS properties */
const COLOR_PROPERTIES = [
  'color', 'background', 'background-color', 'border', 'border-color',
  'outline-color', 'box-shadow',
];

/** Allowed font-size values per typographic scale */
const ALLOWED_FONT_SIZES = ['0.75rem', '0.875rem', '1rem', '1.125rem'];

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripVarReferences(css: string): string {
  return css.replace(/var\([^)]*\)/g, 'var()');
}

/**
 * Parse CSS declarations from file content.
 * Returns array of { property, value } for each declaration.
 */
function parseDeclarations(css: string): Array<{ property: string; value: string }> {
  const cleaned = stripComments(css);
  const declarations: Array<{ property: string; value: string }> = [];
  const lines = cleaned.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match property: value; declarations (not custom property definitions like --token: ...)
    const match = trimmed.match(/^([\w-]+)\s*:\s*(.+?)\s*;?\s*$/);
    if (match && !match[1].startsWith('--')) {
      declarations.push({ property: match[1], value: match[2] });
    }
  }

  return declarations;
}

/**
 * Extract all var(--token-name) references from CSS content.
 */
function extractVarReferences(css: string): string[] {
  const cleaned = stripComments(css);
  const tokens: string[] = [];
  const varPattern = /var\(--([\w-]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = varPattern.exec(cleaned)) !== null) {
    tokens.push(`--${match[1]}`);
  }

  return [...new Set(tokens)];
}

/**
 * Extract custom property definitions from a theme file.
 */
function extractThemeTokens(css: string): Set<string> {
  const tokens = new Set<string>();
  const tokenRegex = /(--[\w-]+)\s*:/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(css)) !== null) {
    tokens.add(match[1]);
  }

  return tokens;
}

/**
 * Check if a value contains a color literal violation.
 */
function findColorViolations(value: string): string[] {
  const violations: string[] = [];
  // Strip var() references so tokens aren't flagged
  const cleaned = stripVarReferences(value);

  // Check hex codes
  const hexPattern = /(?<!\w)#[0-9a-fA-F]{3,8}\b/g;
  let match: RegExpExecArray | null;
  while ((match = hexPattern.exec(cleaned)) !== null) {
    violations.push(`hex: ${match[0]}`);
  }

  // Check rgb/rgba/hsl/hsla functions
  const funcPattern = /\b(rgba?|hsla?)\s*\(/gi;
  while ((match = funcPattern.exec(cleaned)) !== null) {
    violations.push(`function: ${match[0]}`);
  }

  // Check named colors in value tokens
  const tokens = cleaned.split(/[\s,/()]+/);
  for (const token of tokens) {
    const lower = token.toLowerCase().replace(/[;!].*$/, '');
    if (
      CSS_NAMED_COLORS.includes(lower) &&
      !ALLOWED_KEYWORDS.includes(lower)
    ) {
      violations.push(`named color: ${token}`);
    }
  }

  return violations;
}

// --- Tests ---

describe('Property 5: No color literals in card CSS', () => {
  const cardCss = fs.readFileSync(CARD_CSS_PATH, 'utf-8');
  const gridCss = fs.readFileSync(GRID_CSS_PATH, 'utf-8');

  function getColorDeclarations(css: string): Array<{ property: string; value: string }> {
    return parseDeclarations(css).filter(
      (d) => COLOR_PROPERTIES.includes(d.property)
    );
  }

  const cardColorDeclarations = getColorDeclarations(cardCss);
  const gridColorDeclarations = getColorDeclarations(gridCss);
  const allColorDeclarations = [...cardColorDeclarations, ...gridColorDeclarations];

  it('should find color-related declarations to test', () => {
    expect(allColorDeclarations.length).toBeGreaterThan(0);
  });

  it('no color-related property in CraftAuditCard.module.css or CraftAuditGrid.module.css contains color literals', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allColorDeclarations),
        (declaration: { property: string; value: string }) => {
          const violations = findColorViolations(declaration.value);
          expect(
            violations,
            `Property "${declaration.property}: ${declaration.value}" contains color literals:\n  ${violations.join('\n  ')}`
          ).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 6: Font sizes from typographic scale', () => {
  const cardCss = fs.readFileSync(CARD_CSS_PATH, 'utf-8');
  const declarations = parseDeclarations(cardCss);
  const fontSizeDeclarations = declarations.filter((d) => d.property === 'font-size');

  it('should find font-size declarations to test', () => {
    expect(fontSizeDeclarations.length).toBeGreaterThan(0);
  });

  it('every font-size in CraftAuditCard.module.css is from the allowed typographic scale', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...fontSizeDeclarations),
        (declaration: { property: string; value: string }) => {
          expect(
            ALLOWED_FONT_SIZES,
            `font-size value "${declaration.value}" is not in the allowed scale: ${ALLOWED_FONT_SIZES.join(', ')}`
          ).toContain(declaration.value);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 7: Design tokens exist in both themes', () => {
  const cardCss = fs.readFileSync(CARD_CSS_PATH, 'utf-8');
  const gridCss = fs.readFileSync(GRID_CSS_PATH, 'utf-8');
  const paperCss = fs.readFileSync(PAPER_CSS_PATH, 'utf-8');
  const nightCss = fs.readFileSync(NIGHT_CSS_PATH, 'utf-8');

  const referencedTokens = extractVarReferences(cardCss + '\n' + gridCss);
  const paperTokens = extractThemeTokens(paperCss);
  const nightTokens = extractThemeTokens(nightCss);

  it('should find var(--token) references to test', () => {
    expect(referencedTokens.length).toBeGreaterThan(0);
  });

  it('every token referenced in card/grid CSS is defined in both paper.css and night.css', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...referencedTokens),
        (token: string) => {
          expect(
            paperTokens.has(token),
            `Token "${token}" is referenced in component CSS but not defined in paper.css`
          ).toBe(true);
          expect(
            nightTokens.has(token),
            `Token "${token}" is referenced in component CSS but not defined in night.css`
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
