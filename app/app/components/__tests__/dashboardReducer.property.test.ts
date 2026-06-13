// Feature: dashboard-archive-trash, Property 5: REMOVE_ITEM reducer removes exactly the specified item
// Feature: dashboard-archive-trash, Property 6: APPEND_SUCCESS grows item list correctly
// Feature: dashboard-archive-trash, Property 7: Error action preserves items
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DashboardItem } from '@/lib/queries/dashboard/getItems';
import {
  dashboardReducer,
  DashboardState,
  initialState,
} from '../dashboardReducer';

/**
 * Arbitraries for generating random dashboard items and states.
 */
const MIN_TS = new Date('2020-01-01').getTime();
const MAX_TS = new Date('2030-01-01').getTime();

const isoDateArb: fc.Arbitrary<string> = fc
  .integer({ min: MIN_TS, max: MAX_TS })
  .map(ts => new Date(ts).toISOString());

const dashboardItemArb: fc.Arbitrary<DashboardItem> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }).map(String),
  source: fc.constantFrom('series' as const, 'book' as const),
  type: fc.constantFrom('series' as const, 'group' as const, 'standalone_book' as const),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  updatedAt: isoDateArb,
  archived: fc.boolean(),
  bookCount: fc.integer({ min: 0, max: 100 }),
});

const stateArb: fc.Arbitrary<DashboardState> = fc.record({
  items: fc.array(dashboardItemArb, { minLength: 0, maxLength: 20 }),
  hasMore: fc.boolean(),
  nextCursor: fc.option(isoDateArb, { nil: null }),
  isLoading: fc.boolean(),
  error: fc.option(fc.string(), { nil: null }),
});

describe('Feature: dashboard-archive-trash, Property 5: REMOVE_ITEM reducer removes exactly the specified item', () => {
  /**
   * **Validates: Requirements 1.8, 4.4, 5.5, 7.4, 8.5, 10.7**
   *
   * For any state containing one or more items, dispatching REMOVE_ITEM for a
   * specific {id, source} results in a state where that item no longer exists
   * and all other items remain unchanged in the same order.
   */
  it('removes exactly the targeted item and preserves all others in order', () => {
    const stateWithItemsArb = stateArb.filter(s => s.items.length > 0);

    fc.assert(
      fc.property(
        stateWithItemsArb.chain(state =>
          fc.nat({ max: state.items.length - 1 }).map(idx => ({ state, idx }))
        ),
        ({ state, idx }) => {
          const targetItem = state.items[idx];
          const action = {
            type: 'REMOVE_ITEM' as const,
            payload: { id: targetItem.id, source: targetItem.source },
          };

          const result = dashboardReducer(state, action);

          // The target item should no longer exist
          const targetStillExists = result.items.some(
            item => item.id === targetItem.id && item.source === targetItem.source
          );
          expect(targetStillExists).toBe(false);

          // All other items should remain in the same order
          const expectedOthers = state.items.filter(
            item => !(item.id === targetItem.id && item.source === targetItem.source)
          );
          expect(result.items).toEqual(expectedOthers);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 6: APPEND_SUCCESS grows item list correctly', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * For any state with existing items and any valid append batch, dispatching
   * APPEND_SUCCESS results in items array equals the original items concatenated
   * with the new batch, and hasMore/nextCursor are updated from the payload.
   */
  it('concatenates new batch to existing items and updates pagination fields', () => {
    const batchArb = fc.array(dashboardItemArb, { minLength: 1, maxLength: 10 });
    const cursorArb = fc.option(fc.date().map(d => d.toISOString()), { nil: null });
    const hasMoreArb = fc.boolean();

    fc.assert(
      fc.property(
        stateArb,
        batchArb,
        cursorArb,
        hasMoreArb,
        (state, batch, nextCursor, hasMore) => {
          const action = {
            type: 'APPEND_SUCCESS' as const,
            payload: { items: batch, nextCursor, hasMore },
          };

          const result = dashboardReducer(state, action);

          // Items should be original + batch
          expect(result.items).toEqual([...state.items, ...batch]);

          // Pagination fields should match payload
          expect(result.nextCursor).toBe(nextCursor);
          expect(result.hasMore).toBe(hasMore);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 7: Error action preserves items', () => {
  /**
   * **Validates: Requirements 2.5, 4.5**
   *
   * For any dashboard state, dispatching SET_ERROR does not modify the items
   * array — only the error field changes.
   */
  it('SET_ERROR does not modify the items array', () => {
    fc.assert(
      fc.property(
        stateArb,
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        (state, errorMsg) => {
          const action = {
            type: 'SET_ERROR' as const,
            payload: errorMsg,
          };

          const result = dashboardReducer(state, action);

          // Items must remain unchanged
          expect(result.items).toEqual(state.items);

          // Error field must be updated
          expect(result.error).toBe(errorMsg);
        }
      ),
      { numRuns: 100 }
    );
  });
});
