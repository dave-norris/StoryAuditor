/**
 * Debug endpoint to diagnose database connectivity and schema issues
 */

import { query } from '@/lib/db';

export async function GET() {
  const results: any = {
    steps: []
  };

  try {
    // Step 1: Check schema
    results.steps.push({ step: 'Check schema story_auditor' });
    try {
      const schemaResult = await query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'story_auditor'`
      );
      results.steps[results.steps.length - 1].result = schemaResult.rows;
      results.steps[results.steps.length - 1].success = schemaResult.rowCount > 0;
    } catch (error) {
      results.steps[results.steps.length - 1].error = error instanceof Error ? error.message : String(error);
      results.steps[results.steps.length - 1].success = false;
    }

    // Step 2: Check users table
    results.steps.push({ step: 'Check table story_auditor.users' });
    try {
      const tableResult = await query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'story_auditor' AND table_name = 'users'`
      );
      results.steps[results.steps.length - 1].result = tableResult.rows;
      results.steps[results.steps.length - 1].success = tableResult.rowCount > 0;
    } catch (error) {
      results.steps[results.steps.length - 1].error = error instanceof Error ? error.message : String(error);
      results.steps[results.steps.length - 1].success = false;
    }

    // Step 3: Get table structure
    results.steps.push({ step: 'Get users table structure' });
    try {
      const structureResult = await query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'story_auditor' AND table_name = 'users' ORDER BY ordinal_position`
      );
      results.steps[results.steps.length - 1].result = structureResult.rows;
      results.steps[results.steps.length - 1].success = true;
    } catch (error) {
      results.steps[results.steps.length - 1].error = error instanceof Error ? error.message : String(error);
      results.steps[results.steps.length - 1].success = false;
    }

    // Step 4: SELECT * with schema prefix
    results.steps.push({ step: 'SELECT * FROM story_auditor.users' });
    try {
      const selectWithSchemaResult = await query(
        `SELECT * FROM story_auditor.users`
      );
      results.steps[results.steps.length - 1].result = `${selectWithSchemaResult.rowCount} rows`;
      results.steps[results.steps.length - 1].success = true;
    } catch (error) {
      results.steps[results.steps.length - 1].error = error instanceof Error ? error.message : String(error);
      results.steps[results.steps.length - 1].success = false;
    }

    // Step 5: Try the actual duplicate check query with schema
    results.steps.push({ step: 'Try duplicate check: SELECT 1 FROM story_auditor.users WHERE LOWER(email) = LOWER($1)' });
    try {
      const duplicateCheckResult = await query(
        'SELECT 1 FROM story_auditor.users WHERE LOWER(email) = LOWER($1)',
        ['test@example.com']
      );
      results.steps[results.steps.length - 1].result = `${duplicateCheckResult.rowCount} rows`;
      results.steps[results.steps.length - 1].success = true;
    } catch (error) {
      results.steps[results.steps.length - 1].error = error instanceof Error ? error.message : String(error);
      results.steps[results.steps.length - 1].success = false;
    }

    // Step 6: Try INSERT with correct column names
    results.steps.push({ step: 'Try INSERT INTO story_auditor.users with correct columns' });
    try {
      const insertResult = await query(
        `INSERT INTO story_auditor.users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, password_hash, created_dt, updated_dt`,
        ['debug@test.com', 'Debug User', 'hash123']
      );
      results.steps[results.steps.length - 1].result = insertResult.rows[0];
      results.steps[results.steps.length - 1].success = true;
    } catch (error) {
      results.steps[results.steps.length - 1].error = error instanceof Error ? error.message : String(error);
      results.steps[results.steps.length - 1].success = false;
    }

  } catch (error) {
    results.fatalError = error instanceof Error ? error.message : String(error);
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
