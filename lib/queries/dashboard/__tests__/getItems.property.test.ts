// Feature: dashboard-archive-trash, Property 1: View filter returns only matching items
// Feature: dashboard-archive-trash, Property 2: Items are sorted by relevant timestamp descending
// Feature: dashboard-archive-trash, Property 3: Pagination limit invariant
// Feature: dashboard-archive-trash, Property 4: Every item has valid type and required fields
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { getItems } from '../getItems';
import type { PoolClient } from 'pg';

/**
 * Creates a mock PoolClient that returns the given rows from query().
 */
function createMockClient(rows: any[]): PoolClient {
  return {
    query: vi.fn().mockResolvedValue({ rows, rowCount: rows.length }),
  } as unknown as PoolClient;
}

/**
 * Arbitrary for valid source values.
 */
const sourceArb = fc.constantFrom('series', 'book');

/**
 * Arbitrary for valid type values.
 */
const typeArb = fc.constantFrom('series', 'group', 'standalone_book');

/**
 * Arbitrary for a non-empty title string.
 */
const titleArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/**
 * Arbitrary for a random Date within a reasonable range.
 * Uses integer-based generation to guarantee valid Date objects.
 */
const dateArb = fc
  .integer({
    min: new Date('2020-01-01T00:00:00Z').getTime(),
    max: new Date('2030-12-31T23:59:59Z').getTime(),
  })
  .map((ts) => new Date(ts));

/**
 * Arbitrary for a single database row with mixed archived/deleted_at states.
 */
const dbRowArb = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  source: sourceArb,
  type: typeArb,
  title: titleArb,
  updated_at: dateArb,
  archived: fc.boolean(),
  book_count: fc.integer({ min: 0, max: 100 }),
  deleted_at: fc.option(dateArb, { nil: null }),
});

/**
 * Filters rows as the database would for a given archived flag:
 * Only items where archived matches AND deleted_at IS NULL.
 */
function filterRowsForView(rows: any[], archived: boolean): any[] {
  return rows.filter((r) => r.archived === archived && r.deleted_at === null);
}

/**
 * Sorts rows by updated_at descending (as the DB ORDER BY would).
 */
function sortRowsDesc(rows: any[]): any[] {
  return [...rows].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

describe('Feature: dashboard-archive-trash, Property 1: View filter returns only matching items', () => {
  it('querying with archived=false returns only active non-deleted items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dbRowArb, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 50 }),
        async (allRows, limit) => {
          // Simulate what the DB would return for archived=false
          const filteredRows = filterRowsForView(allRows, false);
          const sortedRows = sortRowsDesc(filteredRows);
          const dbReturnedRows = sortedRows.slice(0, limit + 1);

          const client = createMockClient(dbReturnedRows);
          const result = await getItems(client, false, null, limit);

          // Every returned item must have archived=false
          for (const item of result.items) {
            expect(item.archived).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('querying with archived=true returns only archived non-deleted items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dbRowArb, { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 1, max: 50 }),
        async (allRows, limit) => {
          // Simulate what the DB would return for archived=true
          const filteredRows = filterRowsForView(allRows, true);
          const sortedRows = sortRowsDesc(filteredRows);
          const dbReturnedRows = sortedRows.slice(0, limit + 1);

          const client = createMockClient(dbReturnedRows);
          const result = await getItems(client, true, null, limit);

          // Every returned item must have archived=true
          for (const item of result.items) {
            expect(item.archived).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 2: Items are sorted by relevant timestamp descending', () => {
  it('consecutive items have updatedAt values in non-increasing order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dbRowArb, { minLength: 1, maxLength: 30 }).map((rows) =>
          // Ensure we have at least some rows that pass the filter
          rows.map((r) => ({ ...r, archived: false, deleted_at: null }))
        ),
        fc.integer({ min: 2, max: 50 }),
        async (rows, limit) => {
          // Sort rows descending as DB would
          const sortedRows = sortRowsDesc(rows).slice(0, limit + 1);
          const client = createMockClient(sortedRows);
          const result = await getItems(client, false, null, limit);

          // Verify non-increasing order of updatedAt
          for (let i = 1; i < result.items.length; i++) {
            const prev = new Date(result.items[i - 1].updatedAt).getTime();
            const curr = new Date(result.items[i].updatedAt).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 3: Pagination limit invariant', () => {
  it('number of items returned is at most limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dbRowArb, { minLength: 0, maxLength: 60 }).map((rows) =>
          rows.map((r) => ({ ...r, archived: false, deleted_at: null }))
        ),
        fc.integer({ min: 1, max: 50 }),
        async (rows, limit) => {
          // DB returns up to limit+1 rows
          const sortedRows = sortRowsDesc(rows).slice(0, limit + 1);
          const client = createMockClient(sortedRows);
          const result = await getItems(client, false, null, limit);

          expect(result.items.length).toBeLessThanOrEqual(limit);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hasMore is true when DB returns more than limit rows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        async (limit) => {
          // Generate exactly limit+1 rows to trigger hasMore=true
          const rows = Array.from({ length: limit + 1 }, (_, i) => ({
            id: i + 1,
            source: 'series',
            type: 'series',
            title: `Item ${i}`,
            updated_at: new Date(2025, 0, 15 - i),
            archived: false,
            book_count: 0,
            deleted_at: null,
          }));

          const client = createMockClient(rows);
          const result = await getItems(client, false, null, limit);

          expect(result.hasMore).toBe(true);
          expect(result.items.length).toBe(limit);
          expect(result.nextCursor).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hasMore is false when DB returns limit or fewer rows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        async (limit, rowCount) => {
          // Ensure rowCount <= limit (so DB returns at most limit rows)
          const actualCount = Math.min(rowCount, limit);
          const rows = Array.from({ length: actualCount }, (_, i) => ({
            id: i + 1,
            source: 'book',
            type: 'standalone_book',
            title: `Book ${i}`,
            updated_at: new Date(2025, 0, 15 - i),
            archived: false,
            book_count: 0,
            deleted_at: null,
          }));

          const client = createMockClient(rows);
          const result = await getItems(client, false, null, limit);

          expect(result.hasMore).toBe(false);
          expect(result.nextCursor).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 4: Every item has valid type and required fields', () => {
  it('every returned item has non-empty title, valid type, and an updatedAt timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dbRowArb, { minLength: 1, maxLength: 30 }).map((rows) =>
          rows.map((r) => ({ ...r, archived: false, deleted_at: null }))
        ),
        fc.integer({ min: 1, max: 50 }),
        async (rows, limit) => {
          const sortedRows = sortRowsDesc(rows).slice(0, limit + 1);
          const client = createMockClient(sortedRows);
          const result = await getItems(client, false, null, limit);

          const validTypes = ['series', 'group', 'standalone_book'];

          for (const item of result.items) {
            // Non-empty title
            expect(item.title.length).toBeGreaterThan(0);

            // Valid type
            expect(validTypes).toContain(item.type);

            // Has updatedAt as valid ISO timestamp
            expect(item.updatedAt).toBeDefined();
            const parsed = new Date(item.updatedAt);
            expect(parsed.getTime()).not.toBeNaN();

            // Source is valid
            expect(['series', 'book']).toContain(item.source);

            // bookCount is a non-negative number
            expect(item.bookCount).toBeGreaterThanOrEqual(0);

            // id is a non-empty string
            expect(item.id.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
