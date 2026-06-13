import { PoolClient } from 'pg';

/**
 * A dashboard item representing either a series/group container or a standalone book.
 */
export interface DashboardItem {
  id: string;
  source: 'series' | 'book';
  type: 'series' | 'group' | 'standalone_book';
  title: string;
  updatedAt: string;
  archived: boolean;
  bookCount: number;
}

export interface GetItemsResult {
  items: DashboardItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Fetches paginated dashboard items for the current user (scoped via RLS).
 *
 * Uses a UNION ALL query to combine series/group containers with standalone books,
 * sorted by updated_at DESC. Cursor-based pagination uses the updated_at timestamp
 * of the last item from the previous page.
 *
 * The function requests `limit + 1` rows to determine whether more items exist
 * beyond the current page.
 *
 * @param client - A PoolClient within an active RLS transaction
 * @param archived - Filter by archived status (true = archived view, false = active view)
 * @param cursor - ISO 8601 timestamp cursor from the previous page, or null for the first page
 * @param limit - Maximum number of items to return per page
 */
export async function getItems(
  client: PoolClient,
  archived: boolean,
  cursor: string | null,
  limit: number
): Promise<GetItemsResult> {
  const fetchLimit = limit + 1;

  const sql = `
    WITH items AS (
      SELECT
        s.id,
        'series' AS source,
        s.type AS type,
        s.title,
        s.updated_at,
        s.archived,
        (SELECT COUNT(*) FROM story_auditor.books b WHERE b.series_id = s.id AND b.deleted_at IS NULL) AS book_count
      FROM story_auditor.series s
      WHERE s.deleted_at IS NULL
        AND s.archived = $1
        AND ($2::timestamptz IS NULL OR s.updated_at < $2)

      UNION ALL

      SELECT
        b.id,
        'book' AS source,
        'standalone_book' AS type,
        b.title,
        b.updated_at,
        b.archived,
        0 AS book_count
      FROM story_auditor.books b
      WHERE b.series_id IS NULL
        AND b.deleted_at IS NULL
        AND b.archived = $1
        AND ($2::timestamptz IS NULL OR b.updated_at < $2)
    )
    SELECT * FROM items
    ORDER BY updated_at DESC
    LIMIT $3;
  `;

  const result = await client.query(sql, [archived, cursor, fetchLimit]);

  const hasMore = result.rows.length > limit;
  const items: DashboardItem[] = result.rows.slice(0, limit).map((row) => ({
    id: String(row.id),
    source: row.source as 'series' | 'book',
    type: row.type as 'series' | 'group' | 'standalone_book',
    title: row.title,
    updatedAt: new Date(row.updated_at).toISOString(),
    archived: row.archived,
    bookCount: Number(row.book_count),
  }));

  const nextCursor = hasMore && items.length > 0
    ? items[items.length - 1].updatedAt
    : null;

  return { items, nextCursor, hasMore };
}
