import { PoolClient } from 'pg';

/**
 * Returns the count of non-deleted books contained in a series/group.
 *
 * Used by confirmation modals before archiving or deleting a container.
 */
export async function getContainedBookCount(
  client: PoolClient,
  seriesId: string
): Promise<number> {
  const result = await client.query(
    'SELECT COUNT(*)::int AS count FROM story_auditor.books WHERE series_id = $1 AND deleted_at IS NULL',
    [seriesId]
  );

  return result.rows[0].count;
}
