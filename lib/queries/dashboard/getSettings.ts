import { PoolClient } from 'pg';

/**
 * Reads the user's dashboard settings.
 *
 * RLS ensures only the current user's row is returned.
 * Returns a default of 10 for maxDashboardItems if no settings row exists.
 */
export async function getSettings(
  client: PoolClient
): Promise<{ maxDashboardItems: number }> {
  const result = await client.query(
    'SELECT max_dashboard_items FROM story_auditor.user_settings LIMIT 1'
  );

  const maxDashboardItems: number = result.rows[0]?.max_dashboard_items ?? 10;

  return { maxDashboardItems };
}
