// Feature: app-section-placeholder, Property 2: Placeholder page CSS contains no hard-coded color literals
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Property-Based Test: Placeholder page CSS contains no hard-coded color literals
 *
 * For any CSS declaration in `app/app/page.module.css`, the declaration value
 * SHALL contain zero hard-coded color literals (hex codes, rgb/rgba/hsl/hsla
 * functions, or CSS named colors). All color-related values must use `var()`
 * references to theme custom properties.
 *
 * **Validates: Requirements 2.5**
 */

const CSS_FILE_PATH = path.resolve(__dirname, '../page.module.css');

// CSS named colors that should not appear as literal property values
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

// Keywords that look like colors but are allowed
const ALLOWED_KEYWORDS = ['transparent', 'inherit', 'currentcolor', 'initial', 'unset', 'none'];

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripVarReferences(value: string): string {
  return value.replace(/var\([^)]*\)/g, 'var()');
}

function containsHexColor(value: string): string | null {
  const hexPattern = /(?<!\w)#[0-9a-fA-F]{3,8}\b/g;
  const match = hexPattern.exec(value);
  return match ? match[0] : null;
}

function containsRgbHsl(value: string): string | null {
  const pattern = /\b(rgba?|hsla?)\s*\(/gi;
  const match = pattern.exec(value);
  return match ? match[0] : null;
}

function containsNamedColor(value: string): string | null {
  const tokens = value.split(/[\s,/]+/);
  for (const token of tokens) {
    const lower = token.toLowerCase().replace(/[;!].*$/, '');
    if (CSS_NAMED_COLORS.includes(lower) && !ALLOWED_KEYWORDS.includes(lower)) {
      return token;
    }
  }
  return null;
}

interface CssDeclaration {
  property: string;
  value: string;
  line: number;
}

function parseDeclarations(css: string): CssDeclaration[] {
  const cleaned = stripComments(css);
  const declarations: CssDeclaration[] = [];
  const lines = cleaned.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Match CSS property declarations (property: value)
    const match = trimmed.match(/^([\w-]+)\s*:\s*(.+?)\s*;?\s*$/);
    if (match) {
      declarations.push({
        property: match[1],
        value: match[2],
        line: i + 1,
      });
    }
  }

  return declarations;
}

describe('Feature: app-section-placeholder, Property 2: Placeholder page CSS contains no hard-coded color literals', () => {
  const rawCss = fs.readFileSync(CSS_FILE_PATH, 'utf-8');
  const declarations = parseDeclarations(rawCss);

  it('should find CSS declarations to test', () => {
    expect(declarations.length).toBeGreaterThan(0);
  });

  it('no declaration should contain hard-coded color literals', () => {
    // Use fast-check to randomly sample declarations and verify none have color literals
    const declarationArb = fc.nat({ max: declarations.length - 1 }).map(
      (index) => declarations[index]
    );

    fc.assert(
      fc.property(declarationArb, (decl) => {
        const cleanedValue = stripVarReferences(decl.value);

        const hexViolation = containsHexColor(cleanedValue);
        if (hexViolation) {
          return false;
        }

        const rgbHslViolation = containsRgbHsl(cleanedValue);
        if (rgbHslViolation) {
          return false;
        }

        const namedColorViolation = containsNamedColor(cleanedValue);
        if (namedColorViolation) {
          return false;
        }

        return true;
      }),
      {
        numRuns: 100,
        reporter: (runDetails) => {
          if (runDetails.failed) {
            const failedDecl = declarations[runDetails.counterexample![0] as unknown as number] || runDetails.counterexample![0];
            const cleanedValue = stripVarReferences(failedDecl.value);
            const hex = containsHexColor(cleanedValue);
            const rgbHsl = containsRgbHsl(cleanedValue);
            const named = containsNamedColor(cleanedValue);
            const violation = hex || rgbHsl || named;
            throw new Error(
              `Hard-coded color literal found at line ${failedDecl.line}:\n` +
              `  ${failedDecl.property}: ${failedDecl.value}\n` +
              `  Violation: ${violation}\n` +
              `  All color values must use var() references.`
            );
          }
        },
      }
    );
  });
});
