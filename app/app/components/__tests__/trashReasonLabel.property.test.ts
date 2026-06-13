// Feature: dashboard-archive-trash, Property 15: Trash items include reason labels
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { PoolClient } from 'pg';
import { getTrashItems } from '../../../../lib/queries/dashboard/getTrashItems';

/**
 * Property-Based Test: Trash items include reason labels
 *
 * For any trashed item returned by the trash query, the `deletedReasonLabel`
 * field is a non-empty string, and each distinct `deleted_reason` value maps
 * to a unique, human-readable label.
 *
 * Known mappings:
 * - 'manual' → 'Deleted individually'
 * - 'cascade' → 'Deleted with container'
 * - any other value → 'Deleted'
 *
 * **Validates: Requirements 9.3**
 */

function createMockClient(rows: any[]): PoolClient {
  return {
    query: vi.fn().mockResolvedValue({ rows, rowCount: rows.length }),
  } as unknown as PoolClient;
}

function createTrashRow(deletedReason: string, index: number) {
  return {
    id: `item-${index}`,
    source: index % 2 === 0 ? 'series' : 'book',
    type: index % 3 === 0 ? 'series' : index % 3 === 1 ? 'standalone_book' : 'contained_book',
    title: `Item ${index}`,
    deleted_at: new Date(Date.now() - index * 1000).toISOString(),
    deleted_reason: deletedReason,
  };
}

describe('Feature: dashboard-archive-trash, Property 15: Trash items include reason labels', () => {
  it('deletedReasonLabel is always a non-empty string for any deleted_reason value', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 50 }),
        async (reason) => {
          const row = createTrashRow(reason, 0);
          const client = createMockClient([row]);

          const result = await getTrashItems(client, null, 10);

          expect(result.items).toHaveLength(1);
          const item = result.items[0];
          expect(typeof item.deletedReasonLabel).toBe('string');
          expect(item.deletedReasonLabel.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("'manual' always maps to 'Deleted individually'", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 99 }),
        async (index) => {
          const row = createTrashRow('manual', index);
          const client = createMockClient([row]);

          const result = await getTrashItems(client, null, 10);

          expect(result.items[0].deletedReasonLabel).toBe('Deleted individually');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("'cascade' always maps to 'Deleted with container'", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 99 }),
        async (index) => {
          const row = createTrashRow('cascade', index);
          const client = createMockClient([row]);

          const result = await getTrashItems(client, null, 10);

          expect(result.items[0].deletedReasonLabel).toBe('Deleted with container');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("'manual' and 'cascade' produce different labels", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 99 }),
        async (index) => {
          const manualRow = createTrashRow('manual', 0);
          const cascadeRow = createTrashRow('cascade', 1);
          const client = createMockClient([manualRow, cascadeRow]);

          const result = await getTrashItems(client, null, 10);

          expect(result.items[0].deletedReasonLabel).not.toBe(
            result.items[1].deletedReasonLabel
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('different reason values with the same mapping produce the same label', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => s !== 'manual' && s !== 'cascade'
        ),
        fc.string({ minLength: 1, maxLength: 30 }).filter(
          (s) => s !== 'manual' && s !== 'cascade'
        ),
        async (reasonA, reasonB) => {
          const rowA = createTrashRow(reasonA, 0);
          const rowB = createTrashRow(reasonB, 1);
          const client = createMockClient([rowA, rowB]);

          const result = await getTrashItems(client, null, 10);

          // Both unknown reasons should map to the same default label
          expect(result.items[0].deletedReasonLabel).toBe(
            result.items[1].deletedReasonLabel
          );
          expect(result.items[0].deletedReasonLabel).toBe('Deleted');
        }
      ),
      { numRuns: 100 }
    );
  });
});
