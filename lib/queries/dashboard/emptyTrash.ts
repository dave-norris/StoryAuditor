import { PoolClient } from 'pg';

/**
 * Permanently deletes all trashed items (series and books) for the current user.
 *
 * Deletes series first to avoid FK constraint issues, then books.
 * RLS ensures only the current user's rows are affected.
 *
 * @returns success flag and total count of permanently deleted records.
 */
export async function emptyTrash(
  client: PoolClient
): Promise<{ success: boolean; permanentlyDeleted: number }> {
  const seriesResult = await client.query(
    'DELETE FROM story_auditor.series WHERE deleted_at IS NOT NULL'
  );

  const booksResult = await client.query(
    'DELETE FROM story_auditor.books WHERE deleted_at IS NOT NULL'
  );

  const permanentlyDeleted =
    (seriesResult.rowCount ?? 0) + (booksResult.rowCount ?? 0);

  return { success: true, permanentlyDeleted };
}
