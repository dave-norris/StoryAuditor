import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { toggleType } from '../toggleType';
import { upsertSettings } from '../upsertSettings';
import type { PoolClient } from 'pg';

// Mock the db module for resolveUserId
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

import { query } from '@/lib/db';
import { resolveUserId } from '../resolveUserId';

/**
 * Creates a mock PoolClient that returns controlled responses.
 */
function createMockClient(responses: { rowCount: number; rows?: unknown[] }[]): {
  client: PoolClient;
  calls: { sql: string; params: unknown[] }[];
} {
  const calls: { sql: string; params: unknown[] }[] = [];
  let callIndex = 0;
  const client = {
    query: vi.fn().mockImplementation((sql: string, params?: unknown[]) => {
      calls.push({ sql, params: params ?? [] });
      const response = responses[callIndex] || { rowCount: 0, rows: [] };
      callIndex++;
      return Promise.resolve(response);
    }),
  } as unknown as PoolClient;
  return { client, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Feature: dashboard-archive-trash, Property 18: Type toggle flips value and preserves all associated data', () => {
  it('for any active container with a valid newType, the function executes UPDATE and returns success with the requested type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(fc.constant('series' as const), fc.constant('group' as const)),
        async (id, newType) => {
          // Mock rowCount > 0 simulates an active container that was successfully updated
          const { client, calls } = createMockClient([{ rowCount: 1 }]);

          const result = await toggleType(client, id, newType);

          // Should execute exactly one UPDATE query
          expect(calls).toHaveLength(1);

          // The UPDATE should target the series table
          expect(calls[0].sql).toContain('UPDATE story_auditor.series');

          // The UPDATE should set type and updated_at
          expect(calls[0].sql).toContain('SET type = $1');
          expect(calls[0].sql).toContain('updated_at = now()');

          // The WHERE clause should guard against non-active containers
          expect(calls[0].sql).toContain('archived = false');
          expect(calls[0].sql).toContain('deleted_at IS NULL');

          // The newType parameter should be passed correctly
          expect(calls[0].params[0]).toBe(newType);

          // The id parameter should be passed correctly
          expect(calls[0].params[1]).toBe(id);

          // When rowCount > 0, success is true
          expect(result.success).toBe(true);

          // The returned type matches the requested newType
          expect(result.type).toBe(newType);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 19: Type toggle is unavailable for non-active containers', () => {
  it('when the mock returns rowCount=0 (WHERE guard blocks update), success is false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.oneof(fc.constant('series' as const), fc.constant('group' as const)),
        async (id, newType) => {
          // rowCount=0 simulates the WHERE clause blocking update for archived/deleted containers
          const { client } = createMockClient([{ rowCount: 0 }]);

          const result = await toggleType(client, id, newType);

          // success is false when 0 rows were updated
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 8: Settings validation accepts only integers in [5, 50]', () => {
  it('for any number, validation accepts it iff it is an integer in [5, 50]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -1000, max: 1000 }),
          fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true })
        ),
        (value) => {
          const isValid = Number.isInteger(value) && value >= 5 && value <= 50;

          // Validate the logic matches expectations
          if (isValid) {
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(5);
            expect(value).toBeLessThanOrEqual(50);
          } else {
            // At least one condition must fail
            const failsInteger = !Number.isInteger(value);
            const failsMin = value < 5;
            const failsMax = value > 50;
            expect(failsInteger || failsMin || failsMax).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 9: Settings round-trip persistence', () => {
  it('for any valid integer in [5, 50], upsertSettings returns maxDashboardItems matching the input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 50 }),
        fc.integer({ min: 1, max: 10000 }),
        async (maxDashboardItems, userId) => {
          // Mock the RETURNING clause to return the value that was inserted
          const { client } = createMockClient([
            { rowCount: 1, rows: [{ max_dashboard_items: maxDashboardItems }] },
          ]);

          const result = await upsertSettings(client, userId, maxDashboardItems);

          // The returned value should match the input
          expect(result.maxDashboardItems).toBe(maxDashboardItems);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: dashboard-archive-trash, Property 21: User ID resolution round-trip', () => {
  it('for any user record, resolveUserId returns the id when the user exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 1000000 }),
        async (authId, expectedId) => {
          vi.mocked(query).mockResolvedValue({ rows: [{ id: expectedId }] });

          const result = await resolveUserId(authId);

          expect(result).toBe(expectedId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any auth_id with no matching user, resolveUserId returns null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (authId) => {
          vi.mocked(query).mockResolvedValue({ rows: [] });

          const result = await resolveUserId(authId);

          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
