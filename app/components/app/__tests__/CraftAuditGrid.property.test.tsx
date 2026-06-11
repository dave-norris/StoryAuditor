// Feature: craft-audit-cards, Property 1: Grid renders exactly one card per data entry
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { renderToString } from "react-dom/server";
import { CraftAuditGrid } from "../CraftAuditGrid";
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
 * Arbitrary that generates an AuditItem with a non-empty name and description.
 */
const auditItemArb: fc.Arbitrary<AuditItem> = fc.record({
  name: nonEmptyTextArb,
  description: nonEmptyTextArb,
});

/**
 * Arbitrary that generates an AuditCategory with a non-empty name and 1-5 items.
 */
const auditCategoryArb: fc.Arbitrary<AuditCategory> = fc.record({
  name: nonEmptyTextArb,
  items: fc.array(auditItemArb, { minLength: 1, maxLength: 5 }),
});

/**
 * Arbitrary that generates an array of 1 to 20 AuditCategory objects,
 * each with a unique non-empty name.
 */
const categoriesArrayArb: fc.Arbitrary<AuditCategory[]> = fc
  .array(auditCategoryArb, { minLength: 1, maxLength: 20 })
  .map((categories) => {
    // Ensure unique names by appending index suffix
    return categories.map((cat, i) => ({
      ...cat,
      name: `${cat.name}_${i}`,
    }));
  });

/**
 * Property 1: Grid renders exactly one card per data entry
 *
 * For any array of AuditCategory objects (with 1 to 20 entries, each having a
 * non-empty name), rendering CraftAuditGrid SHALL produce exactly one card element
 * per category entry, with no duplicates and no omissions.
 *
 * **Validates: Requirements 1.1, 6.3, 6.4**
 */
describe("Property 1: Grid renders exactly one card per data entry", () => {
  it("should render a section with aria-label and exactly one article per category", () => {
    fc.assert(
      fc.property(categoriesArrayArb, (categories) => {
        const html = renderToString(
          <CraftAuditGrid categories={categories} />
        );

        // Verify the section element with correct aria-label exists
        expect(html).toContain('aria-label="Craft Audit Categories"');

        // Count article elements (CraftAuditCard renders as <article>)
        const articleMatches = html.match(/<article/g);
        expect(articleMatches).not.toBeNull();
        expect(articleMatches!.length).toBe(categories.length);

        // Verify each category name appears in the output (no omissions)
        categories.forEach((category) => {
          expect(html).toContain(escapeHtml(category.name));
        });
      }),
      { numRuns: 100 }
    );
  });
});
