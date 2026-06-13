import { PoolClient } from 'pg';

/**
 * Toggles a series/group container's type between 'series' and 'group'.
 *
 * Only active (non-archived, non-deleted) containers can be toggled.
 * Returns success: false if 0 rows were updated (container not active).
 */
export async function toggleType(
  client: PoolClient,
  id: string,
  newType: 'series' | 'group'
): Promise<{ success: boolean; type: string }> {
  const result = await client.query(
    `UPDATE story_auditor.series
     SET type = $1, updated_at = now()
     WHERE id = $2 AND archived = false AND deleted_at IS NULL`,
    [newType, id]
  );

  const success = (result.rowCount ?? 0) > 0;

  return { success, type: newType };
}
