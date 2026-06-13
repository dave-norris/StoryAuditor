import { PoolClient } from 'pg';

export interface SoftDeleteResult {
  success: boolean;
  deletedCount: number;
}

/**
 * Soft-deletes a dashboard item by setting `deleted_at` and `deleted_reason`.
 *
 * Supports three modes:
 * 1. **Standalone book** (`source = 'book'`): marks the book as deleted with reason 'manual'.
 * 2. **Series delete-all** (`source = 'series'`, `mode = 'delete_all'`): marks the series
 *    and all its contained books as deleted with reason 'cascade'.
 * 3. **Series keep-books** (`source = 'series'`, `mode = 'keep_books'`): marks only the
 *    series as deleted with reason 'manual' and detaches its books (sets `series_id = NULL`),
 *    converting them to standalone books.
 *
 * RLS ensures only the current user's rows are affected.
 *
 * @param client - A PoolClient within an active RLS transaction
 * @param id - The ID of the item to soft-delete
 * @param source - Whether the item is a 'series' or 'book'
 * @param mode - For series only: 'delete_all' cascades to books, 'keep_books' detaches books
 */
export async function softDeleteItem(
  client: PoolClient,
  id: string,
  source: 'series' | 'book',
  mode?: 'delete_all' | 'keep_books'
): Promise<SoftDeleteResult> {
  if (source === 'book') {
    const result = await client.query(
      `UPDATE story_auditor.books
       SET deleted_at = now(), deleted_reason = 'manual'
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    const rowCount = result.rowCount ?? 0;
    return { success: rowCount > 0, deletedCount: rowCount };
  }

  // source === 'series'
  if (mode === 'delete_all') {
    // Mark the series itself as deleted
    await client.query(
      `UPDATE story_auditor.series
       SET deleted_at = now(), deleted_reason = 'cascade'
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    // Cascade-delete all contained books
    const booksResult = await client.query(
      `UPDATE story_auditor.books
       SET deleted_at = now(), deleted_reason = 'cascade'
       WHERE series_id = $1 AND deleted_at IS NULL`,
      [id]
    );

    const booksDeleted = booksResult.rowCount ?? 0;
    return { success: true, deletedCount: 1 + booksDeleted };
  }

  // mode === 'keep_books'
  // Mark only the series as deleted
  const seriesResult = await client.query(
    `UPDATE story_auditor.series
     SET deleted_at = now(), deleted_reason = 'manual'
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  // Detach books from the series (convert to standalone)
  await client.query(
    `UPDATE story_auditor.books
     SET series_id = NULL
     WHERE series_id = $1 AND deleted_at IS NULL`,
    [id]
  );

  const seriesRowCount = seriesResult.rowCount ?? 0;
  return { success: seriesRowCount > 0, deletedCount: seriesRowCount };
}
