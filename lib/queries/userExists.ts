import { query } from '@/lib/db';

/**
 * Check if a user with the given Clerk auth_id exists in the users table.
 * Returns true if found, false otherwise.
 */
export async function userExists(clerkUserId: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM story_auditor.users WHERE auth_id = $1',
    [clerkUserId]
  );
  return result.rowCount > 0;
}
