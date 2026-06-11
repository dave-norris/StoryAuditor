// Feature: landing-page, Property 2: PricingCard renders all provided content

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PricingCard } from '../landing/PricingCard';

/**
 * Property 2: PricingCard renders all provided content
 *
 * For any valid PricingCardProps (with non-empty name, price, and description),
 * rendering the PricingCard component SHALL produce output containing the tier
 * name, the price, and the description string. If a badge string is provided,
 * it SHALL also appear in the output.
 *
 * Validates: Requirements 7.1
 */
describe('Property 2: PricingCard renders all provided content', () => {
  // Arbitrary for non-empty strings that won't conflict with HTML encoding
  const nonEmptyString = fc
    .stringMatching(/^[A-Za-z0-9 _\-.,!?/$]{1,50}$/)
    .filter((s) => s.trim().length > 0);

  // Arbitrary for optional badge (either undefined or a non-empty string)
  const optionalBadge = fc.option(nonEmptyString, { nil: undefined });

  // Arbitrary for optional priceLabel
  const optionalPriceLabel = fc.option(nonEmptyString, { nil: undefined });

  it('should render name, price, and description for any valid props', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        optionalPriceLabel,
        nonEmptyString,
        optionalBadge,
        (name, price, priceLabel, description, badge) => {
          const html = renderToString(
            <PricingCard
              name={name}
              price={price}
              priceLabel={priceLabel}
              description={description}
              badge={badge}
            />
          );

          // Tier name appears in output
          expect(html).toContain(name);

          // Price appears in output
          expect(html).toContain(price);

          // Description appears in output
          expect(html).toContain(description);

          // If priceLabel is provided, it appears in output
          if (priceLabel !== undefined) {
            expect(html).toContain(priceLabel);
          }

          // If badge is provided, it appears in output
          if (badge !== undefined) {
            expect(html).toContain(badge);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
