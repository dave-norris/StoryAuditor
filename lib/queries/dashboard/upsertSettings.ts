import { PoolClient } from 'pg';

/**
 * Creates or updates the user's dashboard settings.
 *
 * Uses INSERT ... ON CONFLICT to upsert the max_dashboard_items value.
 */
export async function upsertSettings(
  client: PoolClient,
  userId: number,
  maxDashboardItems: number
): Promise<{ maxDashboardItems: number }> {
  const result = await client.query(
    `INSERT INTO story_auditor.user_settings (user_id, max_dashboard_items)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       max_dashboard_items = EXCLUDED.max_dashboard_items,
       updated_at = now()
     RETURNING max_dashboard_items`,
    [userId, maxDashboardItems]
  );

  return { maxDashboardItems: result.rows[0].max_dashboard_items };
}
