import { PoolClient } from 'pg';

/**
 * Archives or unarchives a dashboard item.
 *
 * Handles three cases:
 * 1. Standalone book: updates the book record directly.
 * 2. Series/group with cascade (includeBooks=true): updates the container and
 *    all contained non-deleted books. On unarchive, only touches books that are
 *    currently archived.
 * 3. Series/group container-only (includeBooks falsy): updates only the
 *    container record.
 */
export async function archiveItem(
  client: PoolClient,
  id: string,
  source: 'series' | 'book',
  archive: boolean,
  includeBooks?: boolean
): Promise<{ success: boolean; archivedCount: number }> {
  if (source === 'book') {
    const result = await client.query(
      `UPDATE story_auditor.books
       SET archived = $1, updated_at = now()
       WHERE id = $2`,
      [archive, id]
    );

    const rowCount = result.rowCount ?? 0;
    return { success: rowCount > 0, archivedCount: rowCount };
  }

  // source === 'series'
  if (includeBooks) {
    // Update the container
    await client.query(
      `UPDATE story_auditor.series
       SET archived = $1, updated_at = now()
       WHERE id = $2`,
      [archive, id]
    );

    // Cascade to contained books
    let booksResult;
    if (archive) {
      // Archive: update all non-deleted books in this series
      booksResult = await client.query(
        `UPDATE story_auditor.books
         SET archived = $1, updated_at = now()
         WHERE series_id = $2 AND deleted_at IS NULL`,
        [archive, id]
      );
    } else {
      // Unarchive: only update books that are currently archived
      booksResult = await client.query(
        `UPDATE story_auditor.books
         SET archived = false, updated_at = now()
         WHERE series_id = $1 AND archived = true AND deleted_at IS NULL`,
        [id]
      );
    }

    const booksUpdated = booksResult.rowCount ?? 0;
    return { success: true, archivedCount: 1 + booksUpdated };
  }

  // Container only (no cascade)
  const result = await client.query(
    `UPDATE story_auditor.series
     SET archived = $1, updated_at = now()
     WHERE id = $2`,
    [archive, id]
  );

  const rowCount = result.rowCount ?? 0;
  return { success: rowCount > 0, archivedCount: rowCount };
}
