import { PoolClient } from 'pg';

/**
 * Restores a trashed item by clearing deleted_at, deleted_reason, and
 * setting archived = false.
 *
 * For series with includeBooks = true, also restores all contained books
 * that are currently in the trash.
 *
 * RLS ensures only the current user's rows are affected.
 *
 * @param client - A transacted PoolClient (already within BEGIN/COMMIT).
 * @param id - The item's ID (bigint as string).
 * @param source - Whether the item lives in the series or books table.
 * @param includeBooks - For series: also restore contained trashed books.
 * @returns success flag and total count of restored records.
 */
export async function restoreItem(
  client: PoolClient,
  id: string,
  source: 'series' | 'book',
  includeBooks?: boolean
): Promise<{ success: boolean; restoredCount: number }> {
  if (source === 'book') {
    const result = await client.query(
      `UPDATE story_auditor.books
       SET deleted_at = NULL, deleted_reason = NULL, archived = false, updated_at = now()
       WHERE id = $1`,
      [id]
    );

    const rowCount = result.rowCount ?? 0;
    return { success: rowCount > 0, restoredCount: rowCount };
  }

  // source === 'series'
  const seriesResult = await client.query(
    `UPDATE story_auditor.series
     SET deleted_at = NULL, deleted_reason = NULL, archived = false, updated_at = now()
     WHERE id = $1`,
    [id]
  );

  const seriesRestored = seriesResult.rowCount ?? 0;

  if (!includeBooks) {
    return { success: seriesRestored > 0, restoredCount: seriesRestored };
  }

  // Cascade restore to contained books that are currently trashed
  const booksResult = await client.query(
    `UPDATE story_auditor.books
     SET deleted_at = NULL, deleted_reason = NULL, archived = false, updated_at = now()
     WHERE series_id = $1 AND deleted_at IS NOT NULL`,
    [id]
  );

  const booksRestored = booksResult.rowCount ?? 0;

  return { success: true, restoredCount: 1 + booksRestored };
}
