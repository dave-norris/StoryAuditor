// Feature: dashboard-archive-trash, Property 20: All protected routes reject unauthenticated requests
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Test: All protected routes reject unauthenticated requests
 *
 * For any API route serving dashboard, archive, or trash operations, a request
 * without a valid Clerk session receives an HTTP 401 response.
 *
 * **Validates: Requirements 14.1, 14.2**
 */

// Mock Clerk to simulate unauthenticated state
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}));

// Mock the db module to ensure we never reach the database
vi.mock('@/lib/db', () => ({
  withUserTransaction: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/resolveUserId', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/getItems', () => ({
  getItems: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/getSettings', () => ({
  getSettings: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/upsertSettings', () => ({
  upsertSettings: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/archiveItem', () => ({
  archiveItem: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/softDeleteItem', () => ({
  softDeleteItem: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/toggleType', () => ({
  toggleType: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/getTrashItems', () => ({
  getTrashItems: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/restoreItem', () => ({
  restoreItem: vi.fn(),
}));

vi.mock('@/lib/queries/dashboard/emptyTrash', () => ({
  emptyTrash: vi.fn(),
}));

// Import route handlers after mocks are set up
import { GET as getDashboardItems } from '../dashboard/items/route';
import { PATCH as patchArchive } from '../dashboard/items/[id]/archive/route';
import { DELETE as deleteItem } from '../dashboard/items/[id]/route';
import { PATCH as patchType } from '../dashboard/items/[id]/type/route';
import { GET as getSettings, PUT as putSettings } from '../dashboard/settings/route';
import { GET as getTrashItems } from '../trash/items/route';
import { PATCH as patchRestore } from '../trash/items/[id]/restore/route';
import { DELETE as deleteEmptyTrash } from '../trash/empty/route';

// Helper to create Request objects
function createRequest(url: string, method: string, body?: any): Request {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  return new Request(url, init);
}

// Arbitrary for query parameters
const queryParamArb = fc.record({
  view: fc.oneof(fc.constant('active'), fc.constant('archived'), fc.constant(undefined)),
  cursor: fc.oneof(fc.uuid(), fc.constant(undefined)),
  limit: fc.oneof(fc.integer({ min: 1, max: 100 }).map(String), fc.constant(undefined)),
});

// Arbitrary for archive body
const archiveBodyArb = fc.record({
  source: fc.oneof(fc.constant('series'), fc.constant('book')),
  archive: fc.boolean(),
  includeBooks: fc.oneof(fc.boolean(), fc.constant(undefined)),
});

// Arbitrary for delete body
const deleteBodyArb = fc.record({
  source: fc.oneof(fc.constant('series'), fc.constant('book')),
  mode: fc.oneof(fc.constant('delete_all'), fc.constant('keep_books'), fc.constant(undefined)),
});

// Arbitrary for type toggle body
const typeBodyArb = fc.record({
  newType: fc.oneof(fc.constant('series'), fc.constant('group')),
});

// Arbitrary for settings body
const settingsBodyArb = fc.record({
  maxDashboardItems: fc.integer({ min: 1, max: 100 }),
});

// Arbitrary for restore body
const restoreBodyArb = fc.record({
  source: fc.oneof(fc.constant('series'), fc.constant('book')),
  includeBooks: fc.oneof(fc.boolean(), fc.constant(undefined)),
});

// Arbitrary for item IDs
const itemIdArb = fc.uuid();

describe('Property 20: All protected routes reject unauthenticated requests', () => {
  it('GET /api/dashboard/items returns 401 for unauthenticated requests with any query params', async () => {
    await fc.assert(
      fc.asyncProperty(queryParamArb, async (params) => {
        const searchParams = new URLSearchParams();
        if (params.view) searchParams.set('view', params.view);
        if (params.cursor) searchParams.set('cursor', params.cursor);
        if (params.limit) searchParams.set('limit', params.limit);

        const url = `http://localhost:3000/api/dashboard/items?${searchParams.toString()}`;
        const request = createRequest(url, 'GET');
        const response = await getDashboardItems(request);

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('PATCH /api/dashboard/items/:id/archive returns 401 for unauthenticated requests with any body', async () => {
    await fc.assert(
      fc.asyncProperty(itemIdArb, archiveBodyArb, async (id, body) => {
        const url = `http://localhost:3000/api/dashboard/items/${id}/archive`;
        const request = createRequest(url, 'PATCH', body);
        const mockParams = { params: Promise.resolve({ id }) };
        const response = await patchArchive(request, mockParams);

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('DELETE /api/dashboard/items/:id returns 401 for unauthenticated requests with any body', async () => {
    await fc.assert(
      fc.asyncProperty(itemIdArb, deleteBodyArb, async (id, body) => {
        const url = `http://localhost:3000/api/dashboard/items/${id}`;
        const request = createRequest(url, 'DELETE', body);
        const mockParams = { params: Promise.resolve({ id }) };
        const response = await deleteItem(request, mockParams);

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('PATCH /api/dashboard/items/:id/type returns 401 for unauthenticated requests with any body', async () => {
    await fc.assert(
      fc.asyncProperty(itemIdArb, typeBodyArb, async (id, body) => {
        const url = `http://localhost:3000/api/dashboard/items/${id}/type`;
        const request = createRequest(url, 'PATCH', body);
        const mockParams = { params: Promise.resolve({ id }) };
        const response = await patchType(request, mockParams);

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('GET /api/dashboard/settings returns 401 for unauthenticated requests', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const response = await getSettings();

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('PUT /api/dashboard/settings returns 401 for unauthenticated requests with any body', async () => {
    await fc.assert(
      fc.asyncProperty(settingsBodyArb, async (body) => {
        const url = `http://localhost:3000/api/dashboard/settings`;
        const request = createRequest(url, 'PUT', body);
        const response = await putSettings(request);

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('GET /api/trash/items returns 401 for unauthenticated requests with any query params', async () => {
    await fc.assert(
      fc.asyncProperty(queryParamArb, async (params) => {
        const searchParams = new URLSearchParams();
        if (params.cursor) searchParams.set('cursor', params.cursor);
        if (params.limit) searchParams.set('limit', params.limit);

        const url = `http://localhost:3000/api/trash/items?${searchParams.toString()}`;
        const request = createRequest(url, 'GET');
        const response = await getTrashItems(request);

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('PATCH /api/trash/items/:id/restore returns 401 for unauthenticated requests with any body', async () => {
    await fc.assert(
      fc.asyncProperty(itemIdArb, restoreBodyArb, async (id, body) => {
        const url = `http://localhost:3000/api/trash/items/${id}/restore`;
        const request = createRequest(url, 'PATCH', body);
        const mockParams = { params: Promise.resolve({ id }) };
        const response = await patchRestore(request, mockParams);

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });

  it('DELETE /api/trash/empty returns 401 for unauthenticated requests', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const response = await deleteEmptyTrash();

        expect(response.status).toBe(401);
      }),
      { numRuns: 100 }
    );
  });
});
