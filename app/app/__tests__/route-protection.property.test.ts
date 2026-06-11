// Feature: app-section-placeholder, Property 1: Route matcher protects all /app sub-routes
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Property-Based Test: Route matcher protects all /app sub-routes
 *
 * For any URL path string that starts with `/app` (including `/app` itself,
 * `/app/`, `/app/foo`, `/app/deeply/nested/path`), the `isProtectedRoute`
 * route matcher SHALL return `true`, indicating the route requires authentication.
 *
 * Also asserts that `/` (landing page) is NOT matched (stays public),
 * and that `/dashboard` paths remain matched (regression check).
 *
 * **Validates: Requirements 1.2, 1.4**
 */

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/app(.*)']);

/**
 * Creates a minimal NextRequest-like object with the pathname needed
 * by createRouteMatcher (which reads req.nextUrl.pathname).
 */
function fakeRequest(pathname: string) {
  return { nextUrl: { pathname } } as any;
}

/**
 * Arbitrary that generates valid URL path segment characters
 * (lowercase alphanumeric, hyphens, underscores, and slashes).
 */
const pathCharArb = fc.oneof(
  fc.integer({ min: 0x61, max: 0x7a }).map((n) => String.fromCharCode(n)), // a-z
  fc.integer({ min: 0x30, max: 0x39 }).map((n) => String.fromCharCode(n)), // 0-9
  fc.constant('-'),
  fc.constant('_'),
  fc.constant('/')
);

const pathSegmentArb = fc.array(pathCharArb, { minLength: 0, maxLength: 30 })
  .map((chars) => chars.join(''));

/**
 * Arbitrary that generates paths starting with `/app` followed by optional segments.
 * Includes: `/app`, `/app/`, `/app/foo`, `/app/deeply/nested/path`
 */
const appPathArb = pathSegmentArb.map((suffix) => `/app${suffix}`);

/**
 * Arbitrary that generates paths starting with `/dashboard` followed by optional segments.
 * Used for regression testing existing route protection.
 */
const dashboardPathArb = pathSegmentArb.map((suffix) => `/dashboard${suffix}`);

describe('Property 1: Route matcher protects all /app sub-routes', () => {
  it('should match any path starting with /app', () => {
    fc.assert(
      fc.property(appPathArb, (path) => {
        const result = isProtectedRoute(fakeRequest(path));
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT match the landing page at /', () => {
    const result = isProtectedRoute(fakeRequest('/'));
    expect(result).toBe(false);
  });

  it('should still match /dashboard paths (regression)', () => {
    fc.assert(
      fc.property(dashboardPathArb, (path) => {
        const result = isProtectedRoute(fakeRequest(path));
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
