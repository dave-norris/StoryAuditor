// Feature: landing-page, Property 1: FeatureCard renders all provided content
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderToString } from 'react-dom/server';
import { FeatureCard } from '../landing/FeatureCard';

/**
 * Property-Based Test: FeatureCard renders all provided content
 *
 * For any valid FeatureCardProps (with non-empty icon, title, and description strings),
 * rendering the FeatureCard component SHALL produce output containing the icon text,
 * the title text, and the description text.
 *
 * **Validates: Requirements 5.2**
 */

/**
 * Escapes HTML special characters the same way React's renderToString does.
 * This ensures our assertions match the actual HTML output.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Arbitrary that generates non-empty strings suitable for text content.
 * Uses printable ASCII characters (space through tilde) to produce realistic inputs.
 */
const printableCharArb = fc.integer({ min: 0x20, max: 0x7e }).map((n) => String.fromCharCode(n));

const nonEmptyTextArb = fc
  .array(printableCharArb, { minLength: 1, maxLength: 50 })
  .map((chars) => chars.join(''))
  .filter((s) => s.trim().length > 0);

describe('Property 1: FeatureCard renders all provided content', () => {
  it('should render icon, title, and description for any non-empty string inputs', () => {
    fc.assert(
      fc.property(
        nonEmptyTextArb,
        nonEmptyTextArb,
        nonEmptyTextArb,
        (icon, title, description) => {
          const html = renderToString(
            <FeatureCard icon={icon} title={title} description={description} />
          );

          // Compare against HTML-escaped versions since renderToString encodes entities
          expect(html).toContain(escapeHtml(icon));
          expect(html).toContain(escapeHtml(title));
          expect(html).toContain(escapeHtml(description));
        }
      ),
      { numRuns: 100 }
    );
  });
});
