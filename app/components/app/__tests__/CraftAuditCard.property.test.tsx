// Feature: craft-audit-cards, Property 2: Card renders category name as h2 title
// Feature: craft-audit-cards, Property 3: Card renders all audit items in order with correct formatting
// Feature: craft-audit-cards, Property 4: Empty description renders name without separator
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { renderToString } from "react-dom/server";
import { CraftAuditCard } from "../CraftAuditCard";
import type { AuditCategory, AuditItem } from "../../../data/craftAuditData";

/**
 * Escapes HTML special characters the same way React's renderToString does.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Arbitrary that generates non-empty strings suitable for text content.
 * Uses printable ASCII characters (space through tilde) to produce realistic inputs.
 */
const printableCharArb = fc
  .integer({ min: 0x20, max: 0x7e })
  .map((n) => String.fromCharCode(n));

const nonEmptyTextArb = fc
  .array(printableCharArb, { minLength: 1, maxLength: 50 })
  .map((chars) => chars.join(""))
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary that generates a non-empty description string.
 */
const nonEmptyDescriptionArb = nonEmptyTextArb;

/**
 * Arbitrary that generates an AuditItem with a non-empty name and non-empty description.
 */
const auditItemWithDescArb: fc.Arbitrary<AuditItem> = fc.record({
  name: nonEmptyTextArb,
  description: nonEmptyDescriptionArb,
});

/**
 * Arbitrary that generates an AuditItem with a non-empty name and empty description.
 */
const auditItemEmptyDescArb: fc.Arbitrary<AuditItem> = fc.record({
  name: nonEmptyTextArb,
  description: fc.constant(""),
});

/**
 * Arbitrary that generates an AuditCategory with a non-empty name and 1-10 items
 * (all with non-empty descriptions).
 */
const auditCategoryArb: fc.Arbitrary<AuditCategory> = fc.record({
  name: nonEmptyTextArb,
  items: fc.array(auditItemWithDescArb, { minLength: 1, maxLength: 10 }),
});

/**
 * Property 2: Card renders category name as h2 title
 *
 * For any AuditCategory with a non-empty name string, rendering CraftAuditCard
 * SHALL produce an <h2> element containing that category name.
 *
 * **Validates: Requirements 2.1, 5.2**
 */
describe("Property 2: Card renders category name as h2 title", () => {
  it("should render an h2 element containing the category name for any non-empty name", () => {
    fc.assert(
      fc.property(auditCategoryArb, (category) => {
        const html = renderToString(<CraftAuditCard category={category} />);

        // Verify an h2 element exists containing the category name
        const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/;
        const match = html.match(h2Regex);
        expect(match).not.toBeNull();
        expect(match![1]).toContain(escapeHtml(category.name));
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Card renders all audit items in order with correct formatting
 *
 * For any AuditCategory with one or more AuditItem entries (each having a non-empty
 * name and a description string), rendering CraftAuditCard SHALL produce a <ul>
 * containing one <li> per item, in the same order as the input array, where each
 * item's name appears within a <strong> tag followed by a colon and space and then
 * the description text.
 *
 * **Validates: Requirements 2.2, 2.3, 2.9, 5.3**
 */
describe("Property 3: Card renders all audit items in order with correct formatting", () => {
  it("should render a ul with li elements in order, each with strong name followed by colon-space and description", () => {
    fc.assert(
      fc.property(auditCategoryArb, (category) => {
        const html = renderToString(<CraftAuditCard category={category} />);

        // Verify a <ul> element exists
        expect(html).toMatch(/<ul[^>]*>/);

        // Extract all <li> elements in order
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
        const liMatches = [...html.matchAll(liRegex)];

        // Should have exactly one li per item
        expect(liMatches.length).toBe(category.items.length);

        // Verify each li has the correct content in order
        category.items.forEach((item, index) => {
          const liContent = liMatches[index][1];
          const escapedName = escapeHtml(item.name);
          const escapedDesc = escapeHtml(item.description);

          // Name should be within a <strong> tag
          const strongRegex = /<strong[^>]*>([\s\S]*?)<\/strong>/;
          const strongMatch = liContent.match(strongRegex);
          expect(strongMatch).not.toBeNull();
          expect(strongMatch![1]).toContain(escapedName);

          // After the strong tag, there should be ": " followed by description
          // React's renderToString produces: <strong>name</strong>: <!-- -->description
          expect(liContent).toContain(`${escapedName}</strong>`);
          // Verify colon separator and description are present after the strong tag
          const afterStrong = liContent.split("</strong>")[1] || "";
          expect(afterStrong).toContain(":");
          expect(liContent).toContain(escapedDesc);
        });
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Empty description renders name without separator
 *
 * For any AuditItem with a non-empty name and an empty string description,
 * rendering the item within CraftAuditCard SHALL produce the name in bold
 * without a trailing colon or separator character.
 *
 * **Validates: Requirements 2.10**
 */
describe("Property 4: Empty description renders name without separator", () => {
  it("should render name in bold without colon when description is empty", () => {
    fc.assert(
      fc.property(
        nonEmptyTextArb,
        fc.array(auditItemEmptyDescArb, { minLength: 1, maxLength: 5 }),
        (categoryName, items) => {
          const category: AuditCategory = { name: categoryName, items };
          const html = renderToString(<CraftAuditCard category={category} />);

          // Extract all <li> elements
          const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
          const liMatches = [...html.matchAll(liRegex)];

          expect(liMatches.length).toBe(items.length);

          items.forEach((item, index) => {
            const liContent = liMatches[index][1];
            const escapedName = escapeHtml(item.name);

            // Name should be within a <strong> tag
            const strongRegex = /<strong[^>]*>([\s\S]*?)<\/strong>/;
            const strongMatch = liContent.match(strongRegex);
            expect(strongMatch).not.toBeNull();
            expect(strongMatch![1]).toContain(escapedName);

            // There should be NO colon after the strong closing tag
            const afterStrong = liContent.split("</strong>")[1] || "";
            expect(afterStrong).not.toMatch(/^\s*:/);
            expect(afterStrong).not.toContain(":");
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
