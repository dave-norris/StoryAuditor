import { query } from '@/lib/db';

export interface CreateUserParams {
  authId: string;
  name: string;
  email: string;
}

/**
 * Insert a new user into the users table.
 * Returns the created user's id.
 */
export async function createUser(params: CreateUserParams): Promise<number> {
  const result = await query(
    `INSERT INTO story_auditor.users (auth_id, name, email)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [params.authId, params.name, params.email]
  );
  return result.rows[0].id;
}
