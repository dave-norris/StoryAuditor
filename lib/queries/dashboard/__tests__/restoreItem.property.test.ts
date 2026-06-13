// Feature: dashboard-archive-trash, Property 16: Restore clears deletion fields and sets archived to false
// Feature: dashboard-archive-trash, Property 17: Empty trash removes all trashed items and count matches
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { restoreItem } from '../restoreItem';
import { emptyTrash } from '../emptyTrash';
import type { PoolClient } from 'pg';

/**
 * Creates a mock PoolClient that records all query calls and returns
 * controlled responses in order.
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
 * Arbitrary for generating item IDs (bigint as string).
 */
const idArb = fc.integer({ min: 1, max: 999999 }).map(String);

/**
 * Arbitrary for source type.
 */
const sourceArb = fc.oneof(
  fc.constant('series' as const),
  fc.constant('book' as const)
);

/**
 * Arbitrary for rowCount values (0 or more affected rows).
 */
const rowCountArb = fc.integer({ min: 0, max: 100 });

/**
 * Property-Based Test: Restore clears deletion fields and sets archived to false
 *
 * For any trashed item (book or series), calling restoreItem results in an UPDATE
 * query that sets `deleted_at = NULL`, `deleted_reason = NULL`, and `archived = false`.
 * The returned restoredCount matches the rowCount.
 *
 * **Validates: Requirements 10.1, 10.2**
 */
describe('Property 16: Restore clears deletion fields and sets archived to false', () => {
  it('book restore: SQL sets deleted_at=NULL, deleted_reason=NULL, archived=false and restoredCount matches rowCount', () => {
    fc.assert(
      fc.asyncProperty(idArb, rowCountArb, async (id, rowCount) => {
        const { client, queryCalls } = createMockClient([{ rowCount }]);

        const result = await restoreItem(client, id, 'book');

        // Exactly one query issued for book
        expect(queryCalls).toHaveLength(1);

        const sql = queryCalls[0].sql;
        // SQL must clear deletion fields and set archived to false
        expect(sql).toContain('deleted_at = NULL');
        expect(sql).toContain('deleted_reason = NULL');
        expect(sql).toContain('archived = false');

        // Params include the ID
        expect(queryCalls[0].params).toContain(id);

        // restoredCount matches the rowCount from DB
        expect(result.restoredCount).toBe(rowCount);
        expect(result.success).toBe(rowCount > 0);
      }),
      { numRuns: 100 }
    );
  });

  it('series restore without cascade: SQL sets deleted_at=NULL, deleted_reason=NULL, archived=false', () => {
    fc.assert(
      fc.asyncProperty(idArb, rowCountArb, async (id, rowCount) => {
        const { client, queryCalls } = createMockClient([{ rowCount }]);

        const result = await restoreItem(client, id, 'series', false);

        // Only one query for series without cascade
        expect(queryCalls).toHaveLength(1);

        const sql = queryCalls[0].sql;
        expect(sql).toContain('deleted_at = NULL');
        expect(sql).toContain('deleted_reason = NULL');
        expect(sql).toContain('archived = false');
        expect(queryCalls[0].params).toContain(id);

        expect(result.restoredCount).toBe(rowCount);
        expect(result.success).toBe(rowCount > 0);
      }),
      { numRuns: 100 }
    );
  });

  it('series restore with includeBooks=true: two queries issued and restoredCount = 1 + booksRowCount', () => {
    fc.assert(
      fc.asyncProperty(idArb, rowCountArb, async (id, booksRowCount) => {
        // Series restore always returns rowCount=1 for the series itself
        const { client, queryCalls } = createMockClient([
          { rowCount: 1 },          // series update
          { rowCount: booksRowCount }, // books cascade update
        ]);

        const result = await restoreItem(client, id, 'series', true);

        // Two queries: one for series, one for books
        expect(queryCalls).toHaveLength(2);

        // Both queries set the correct fields
        for (const call of queryCalls) {
          expect(call.sql).toContain('deleted_at = NULL');
          expect(call.sql).toContain('deleted_reason = NULL');
          expect(call.sql).toContain('archived = false');
        }

        // First query targets series table
        expect(queryCalls[0].sql).toContain('series');
        expect(queryCalls[0].params).toContain(id);

        // Second query targets books table with series_id
        expect(queryCalls[1].sql).toContain('books');
        expect(queryCalls[1].params).toContain(id);

        // restoredCount = 1 (series) + booksRowCount
        expect(result.restoredCount).toBe(1 + booksRowCount);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property-Based Test: Empty trash removes all trashed items and count matches
 *
 * For any user with N trashed items across series and books tables, executing
 * emptyTrash results in two DELETE queries and the total permanentlyDeleted
 * count equals the sum of both rowCounts.
 *
 * **Validates: Requirements 11.4, 11.5**
 */
describe('Property 17: Empty trash removes all trashed items and count matches', () => {
  it('emptyTrash makes two DELETE queries and permanentlyDeleted = seriesRowCount + booksRowCount', () => {
    fc.assert(
      fc.asyncProperty(rowCountArb, rowCountArb, async (seriesRowCount, booksRowCount) => {
        const { client, queryCalls } = createMockClient([
          { rowCount: seriesRowCount },
          { rowCount: booksRowCount },
        ]);

        const result = await emptyTrash(client);

        // Exactly two queries
        expect(queryCalls).toHaveLength(2);

        // Both are DELETE queries
        expect(queryCalls[0].sql.toUpperCase()).toContain('DELETE');
        expect(queryCalls[1].sql.toUpperCase()).toContain('DELETE');

        // First deletes from series (to avoid FK constraint issues)
        expect(queryCalls[0].sql).toContain('series');
        // Second deletes from books
        expect(queryCalls[1].sql).toContain('books');

        // permanentlyDeleted = sum of both rowCounts
        expect(result.permanentlyDeleted).toBe(seriesRowCount + booksRowCount);

        // success is always true
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
