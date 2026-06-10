// Feature: landing-page, Property 2: PricingCard renders all provided content

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PricingCard } from '../landing/PricingCard';

/**
 * Property 2: PricingCard renders all provided content
 *
 * For any valid PricingCardProps (with non-empty name, price, features array,
 * ctaLabel, and ctaHref), rendering the PricingCard component SHALL produce
 * output containing the tier name, the price, each feature string, the CTA
 * button label, and a link with the correct href. If a badge string is provided,
 * it SHALL also appear in the output.
 *
 * Validates: Requirements 7.1
 */
describe('Property 2: PricingCard renders all provided content', () => {
  // Arbitrary for non-empty strings that won't conflict with HTML encoding
  const nonEmptyString = fc
    .stringMatching(/^[A-Za-z0-9 _\-.,!?/$]+$/, { minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0);

  // Arbitrary for href-like strings
  const hrefString = fc.constantFrom(
    '/analyze',
    '/signup?plan=book-pass',
    '/signup?plan=author',
    '/pricing',
    '/dashboard',
    '/start'
  );

  // Arbitrary for non-empty features arrays (1-10 unique features)
  const featuresArray = fc
    .array(nonEmptyString, { minLength: 1, maxLength: 10 })
    .map((arr) => [...new Set(arr)])
    .filter((arr) => arr.length >= 1);

  // Arbitrary for optional badge (either undefined or a non-empty string)
  const optionalBadge = fc.option(nonEmptyString, { nil: undefined });

  it('should render name, price, features, ctaLabel, and ctaHref for any valid props', () => {
    fc.assert(
      fc.property(
        nonEmptyString,
        nonEmptyString,
        featuresArray,
        nonEmptyString,
        hrefString,
        optionalBadge,
        (name, price, features, ctaLabel, ctaHref, badge) => {
          const html = renderToString(
            <PricingCard
              name={name}
              price={price}
              features={features}
              ctaLabel={ctaLabel}
              ctaHref={ctaHref}
              badge={badge}
            />
          );

          // Tier name appears in output
          expect(html).toContain(name);

          // Price appears in output
          expect(html).toContain(price);

          // Each feature string appears in output
          for (const feature of features) {
            expect(html).toContain(feature);
          }

          // CTA button label appears in output
          expect(html).toContain(ctaLabel);

          // Link with correct href appears in output
          expect(html).toContain(ctaHref);

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
