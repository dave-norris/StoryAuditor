import { PoolClient } from 'pg';

/**
 * Represents a soft-deleted item displayed on the Trash page.
 */
export interface TrashItem {
  id: string;
  source: 'series' | 'book';
  type: 'series' | 'group' | 'standalone_book' | 'contained_book';
  title: string;
  deletedAt: string; // ISO 8601
  deletedReason: string;
  deletedReasonLabel: string; // Human-readable label
}

export interface TrashItemsResult {
  items: TrashItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Maps a raw `deleted_reason` value to a human-readable label.
 */
function getDeletedReasonLabel(reason: string): string {
  switch (reason) {
    case 'manual':
      return 'Deleted individually';
    case 'cascade':
      return 'Deleted with container';
    default:
      return 'Deleted';
  }
}

/**
 * Retrieves soft-deleted items (series, standalone books, and contained books)
 * with cursor-based pagination, ordered by `deleted_at DESC`.
 *
 * Validates: Requirements 9.1, 9.2, 9.3
 *
 * @param client - A PoolClient within an active RLS-scoped transaction
 * @param cursor - ISO 8601 timestamp cursor for pagination (null for first page)
 * @param limit  - Maximum number of items to return per page
 */
export async function getTrashItems(
  client: PoolClient,
  cursor: string | null,
  limit: number
): Promise<TrashItemsResult> {
  const cursorParam = cursor ?? null;
  // Request one extra row to determine if more pages exist
  const fetchLimit = limit + 1;

  const sql = `
    WITH trashed AS (
      SELECT
        s.id, 'series' AS source, s.type AS type, s.title,
        s.deleted_at, s.deleted_reason
      FROM story_auditor.series s
      WHERE s.deleted_at IS NOT NULL
        AND ($1::timestamptz IS NULL OR s.deleted_at < $1)

      UNION ALL

      SELECT
        b.id, 'book' AS source, 'standalone_book' AS type, b.title,
        b.deleted_at, b.deleted_reason
      FROM story_auditor.books b
      WHERE b.series_id IS NULL
        AND b.deleted_at IS NOT NULL
        AND ($1::timestamptz IS NULL OR b.deleted_at < $1)

      UNION ALL

      SELECT
        b.id, 'book' AS source,
        'contained_book' AS type,
        b.title, b.deleted_at, b.deleted_reason
      FROM story_auditor.books b
      WHERE b.deleted_at IS NOT NULL
        AND b.series_id IS NOT NULL
        AND ($1::timestamptz IS NULL OR b.deleted_at < $1)
    )
    SELECT * FROM trashed
    ORDER BY deleted_at DESC
    LIMIT $2;
  `;

  const result = await client.query(sql, [cursorParam, fetchLimit]);

  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;

  const items: TrashItem[] = rows.map((row: any) => ({
    id: row.id.toString(),
    source: row.source as TrashItem['source'],
    type: row.type as TrashItem['type'],
    title: row.title,
    deletedAt: new Date(row.deleted_at).toISOString(),
    deletedReason: row.deleted_reason,
    deletedReasonLabel: getDeletedReasonLabel(row.deleted_reason),
  }));

  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1].deletedAt
    : null;

  return { items, nextCursor, hasMore };
}
