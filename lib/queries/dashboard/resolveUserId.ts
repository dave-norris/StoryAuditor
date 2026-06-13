import { query } from '@/lib/db';

/**
 * Resolves a Clerk auth_id to the internal story_auditor.users.id.
 *
 * Runs outside the RLS transaction since the users table lookup
 * does not require row-level security context.
 *
 * @returns The internal numeric user ID, or null if no matching user exists.
 */
export async function resolveUserId(clerkAuthId: string): Promise<number | null> {
  const result = await query(
    'SELECT id FROM story_auditor.users WHERE auth_id = $1',
    [clerkAuthId]
  );
  return result.rows[0]?.id ?? null;
}
