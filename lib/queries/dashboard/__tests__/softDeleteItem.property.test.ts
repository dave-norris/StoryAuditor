// Feature: dashboard-archive-trash, Property 13: Soft-delete sets deleted_at and deleted_reason correctly
// Feature: dashboard-archive-trash, Property 14: Keep-books mode detaches books from series
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { softDeleteItem } from '../softDeleteItem';
import type { PoolClient } from 'pg';

/**
 * Creates a mock PoolClient that tracks query calls and returns configurable responses.
 */
function createMockClient(responses: { rowCount: number }[]): {
  client: PoolClient;
  queryCalls: { sql: string; params: any[] }[];
} {
  const queryCalls: { sql: string; params: any[] }[] = [];
  let callIndex = 0;
  const client = {
    query: vi.fn().mockImplementation((sql: string, params?: any[]) => {
      queryCalls.push({ sql, params: params || [] });
      const response = responses[callIndex] || { rowCount: 0 };
      callIndex++;
      return Promise.resolve(response);
    }),
  } as unknown as PoolClient;
  return { client, queryCalls };
}

/**
 * Arbitrary: UUID-like string IDs
 */
const idArb = fc.uuid();

/**
 * Arbitrary: positive row count representing affected rows
 */
const rowCountArb = fc.integer({ min: 0, max: 100 });

/**
 * Property 13: Soft-delete sets deleted_at and deleted_reason correctly
 *
 * For any standalone book (source='book'), the function calls UPDATE with
 * `deleted_reason = 'manual'`. For cascade mode on series, the series and
 * books both get `deleted_reason = 'cascade'`.
 *
 * **Validates: Requirements 7.2, 8.2**
 */
describe('Property 13: Soft-delete sets deleted_at and deleted_reason correctly', () => {
  it('standalone book soft-delete sets deleted_reason to manual', async () => {
    await fc.assert(
      fc.asyncProperty(idArb, rowCountArb, async (id, rowCount) => {
        const { client, queryCalls } = createMockClient([{ rowCount }]);

        const result = await softDeleteItem(client, id, 'book');

        // Should issue exactly one query
        expect(queryCalls).toHaveLength(1);

        // The SQL should contain 'manual' as the deleted_reason
        const sql = queryCalls[0].sql;
        expect(sql).toContain("deleted_reason = 'manual'");
        expect(sql).toContain('deleted_at = now()');

        // Parameters should include the id
        expect(queryCalls[0].params).toContain(id);

        // Return value should match rowCount
        expect(result.deletedCount).toBe(rowCount);
        expect(result.success).toBe(rowCount > 0);
      }),
      { numRuns: 100 }
    );
  });

  it('series delete_all sets deleted_reason to cascade for both series and books', async () => {
    await fc.assert(
      fc.asyncProperty(idArb, rowCountArb, async (id, booksRowCount) => {
        const { client, queryCalls } = createMockClient([
          { rowCount: 1 },         // series update
          { rowCount: booksRowCount }, // books cascade update
        ]);

        const result = await softDeleteItem(client, id, 'series', 'delete_all');

        // Should issue exactly two queries
        expect(queryCalls).toHaveLength(2);

        // First query: series with cascade reason
        const seriesSql = queryCalls[0].sql;
        expect(seriesSql).toContain("deleted_reason = 'cascade'");
        expect(seriesSql).toContain('deleted_at = now()');
        expect(queryCalls[0].params).toContain(id);

        // Second query: books with cascade reason
        const booksSql = queryCalls[1].sql;
        expect(booksSql).toContain("deleted_reason = 'cascade'");
        expect(booksSql).toContain('deleted_at = now()');
        expect(queryCalls[1].params).toContain(id);

        // Return value: 1 (series) + booksRowCount
        expect(result.deletedCount).toBe(1 + booksRowCount);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 14: Keep-books mode detaches books from series
 *
 * For any series with mode='keep_books', the series gets `deleted_reason = 'manual'`
 * and books get `series_id = NULL` (verified by checking the SQL contains SET series_id = NULL).
 *
 * **Validates: Requirements 8.3**
 */
describe('Property 14: Keep-books mode detaches books from series', () => {
  it('keep_books marks series as manual-deleted and detaches books with series_id = NULL', async () => {
    await fc.assert(
      fc.asyncProperty(idArb, rowCountArb, async (id, seriesRowCount) => {
        const { client, queryCalls } = createMockClient([
          { rowCount: seriesRowCount }, // series delete
          { rowCount: 3 },              // books detach (arbitrary count)
        ]);

        const result = await softDeleteItem(client, id, 'series', 'keep_books');

        // Should issue exactly two queries
        expect(queryCalls).toHaveLength(2);

        // First query: series with manual reason and deleted_at
        const seriesSql = queryCalls[0].sql;
        expect(seriesSql).toContain("deleted_reason = 'manual'");
        expect(seriesSql).toContain('deleted_at = now()');
        expect(queryCalls[0].params).toContain(id);

        // Second query: books get series_id = NULL (detached)
        const booksSql = queryCalls[1].sql;
        expect(booksSql).toContain('series_id = NULL');
        expect(queryCalls[1].params).toContain(id);

        // The books SET clause should NOT set deleted_at (books are kept alive)
        // Extract the SET clause to verify (between SET and WHERE)
        const setClauseMatch = booksSql.match(/SET\s+(.*?)\s+WHERE/s);
        expect(setClauseMatch).not.toBeNull();
        const setClause = setClauseMatch![1];
        expect(setClause).not.toContain('deleted_at');
        expect(setClause).not.toContain('deleted_reason');

        // Return value: only the series rowCount (books aren't deleted)
        expect(result.deletedCount).toBe(seriesRowCount);
        expect(result.success).toBe(seriesRowCount > 0);
      }),
      { numRuns: 100 }
    );
  });
});
