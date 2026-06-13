import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { archiveItem } from '../archiveItem';
import type { PoolClient } from 'pg';

/**
 * Creates a mock PoolClient that tracks query calls and returns controlled responses.
 */
function createMockClient(responses: { rowCount: number }[]): { client: PoolClient; calls: { sql: string; params: unknown[] }[] } {
  const calls: { sql: string; params: unknown[] }[] = [];
  let callIndex = 0;
  const client = {
    query: vi.fn().mockImplementation((sql: string, params?: unknown[]) => {
      calls.push({ sql, params: params ?? [] });
      const response = responses[callIndex] || { rowCount: 0 };
      callIndex++;
      return Promise.resolve(response);
    }),
  } as unknown as PoolClient;
  return { client, calls };
}

describe('Feature: dashboard-archive-trash, Property 10: Archive/unarchive toggles the archived flag correctly', () => {
  it('for any standalone book, the function calls UPDATE with the correct archived value and returns archivedCount matching rowCount', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        fc.integer({ min: 0, max: 10 }),
        async (id, archive, rowCount) => {
          const { client, calls } = createMockClient([{ rowCount }]);

          const result = await archiveItem(client, id, 'book', archive);

          // Should execute exactly one UPDATE query
          expect(calls).toHaveLength(1);

          // The UPDATE should target books table
          expect(calls[0].sql).toContain('UPDATE story_auditor.books');

          // The archived parameter should match the input
          expect(calls[0].params[0]).toBe(archive);

          // The id parameter should match the input
          expect(calls[0].params[1]).toBe(id);

          // archivedCount should match rowCount
          expect(result.archivedCount).toBe(rowCount);

          // success should be true only when rowCount > 0
          expect(result.success).toBe(rowCount > 0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 11: Cascade archive/unarchive applies to container and all contained books', () => {
  it('for any series with includeBooks=true, two UPDATE queries are executed and archivedCount = 1 + books rowCount', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        fc.integer({ min: 0, max: 50 }),
        async (id, archive, booksRowCount) => {
          // First response is for the series UPDATE (rowCount doesn't matter for cascade logic)
          // Second response is for the books UPDATE
          const { client, calls } = createMockClient([
            { rowCount: 1 },
            { rowCount: booksRowCount },
          ]);

          const result = await archiveItem(client, id, 'series', archive, true);

          // Should execute exactly two UPDATE queries
          expect(calls).toHaveLength(2);

          // First UPDATE should target series table
          expect(calls[0].sql).toContain('UPDATE story_auditor.series');
          expect(calls[0].params).toContain(archive);
          expect(calls[0].params).toContain(id);

          // Second UPDATE should target books table
          expect(calls[1].sql).toContain('UPDATE story_auditor.books');

          // archivedCount should be 1 (the container) + booksRowCount
          expect(result.archivedCount).toBe(1 + booksRowCount);

          // success should always be true for cascade operations
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 12: Container-only operations leave books unchanged', () => {
  it('for any series with includeBooks=false/undefined, only one UPDATE query is executed for the series record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        fc.integer({ min: 0, max: 10 }),
        fc.oneof(fc.constant(false), fc.constant(undefined)),
        async (id, archive, rowCount, includeBooks) => {
          const { client, calls } = createMockClient([{ rowCount }]);

          const result = await archiveItem(client, id, 'series', archive, includeBooks);

          // Should execute exactly one UPDATE query
          expect(calls).toHaveLength(1);

          // The UPDATE should target series table only
          expect(calls[0].sql).toContain('UPDATE story_auditor.series');

          // Should NOT contain any books-related UPDATE
          expect(calls[0].sql).not.toContain('story_auditor.books');

          // The archived parameter should match the input
          expect(calls[0].params[0]).toBe(archive);

          // The id parameter should match the input
          expect(calls[0].params[1]).toBe(id);

          // archivedCount should match rowCount from the single query
          expect(result.archivedCount).toBe(rowCount);

          // success should be true only when rowCount > 0
          expect(result.success).toBe(rowCount > 0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
