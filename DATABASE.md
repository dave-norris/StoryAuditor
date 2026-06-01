# Database Setup

This project uses **node-postgres (pg)** for direct PostgreSQL connections instead of Prisma.

## Why pg instead of Prisma?

- **Simpler**: Direct SQL queries without ORM abstraction
- **Easier to debug**: Direct control over connection strings and pool settings
- **Lighter**: Fewer dependencies and smaller bundle
- **Better for Railway**: Avoids Prisma's version upgrade issues and adapter complexity

## Environment Variables

Set `DATABASE_URL` in your environment:

```
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Local Development

Create `.env.local`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/storyauditor"
```

### Railway Deployment

Railway automatically injects `DATABASE_URL` at runtime. Ensure:
1. PostgreSQL service is created in Railway
2. Next.js and PostgreSQL services are in the **same region**
3. Services are connected (see the connection line in Railway dashboard)

## Migrations

Migrations are stored as SQL files in the `migrations/` directory.

### Running Migrations

Migrations run automatically on startup:

```bash
npm start
```

Or manually:

```bash
npx ts-node scripts/migrate.ts
```

### Creating a New Migration

1. Create a new SQL file in `migrations/` with format: `NNN_description.sql`
2. Write your SQL statements
3. Migrations are tracked in the `_migrations` table

Example:

```sql
-- migrations/002_add_users_table.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database API

### Health Check

```typescript
import { checkDatabaseHealth } from '@/lib/db';

const health = await checkDatabaseHealth();
// Returns: { status: 'healthy' | 'unhealthy', message, responseTime, timestamp }
```

### Query Execution

```typescript
import { query } from '@/lib/db';

const result = await query('SELECT * FROM "User" WHERE id = $1', [1]);
```

### Transactions

```typescript
import { getClient } from '@/lib/db';

const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO "User" (email, name) VALUES ($1, $2)', ['user@example.com', 'John']);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correct.

### Can't reach database server

```
Error: Can't reach database server at `postgres.railway.internal:5432`
```

**Solution on Railway**:
1. Check both services are in the same region
2. Verify the connection line exists between services in the dashboard
3. Use the private domain (`postgres.railway.internal`) not the public one

### Authentication Failed

```
Error: password authentication failed for user "postgres"
```

**Solution**: Check username and password in `DATABASE_URL`.

## Health Check Endpoint

The app provides a health check endpoint at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Response:

```json
{
  "status": "healthy",
  "message": "Database connection successful",
  "responseTime": 45,
  "timestamp": "2026-06-01T12:00:00.000Z",
  "database": {
    "connected": true,
    "poolSize": 20,
    "activeConnections": 1,
    "idleConnections": 19,
    "lastError": null,
    "lastErrorTime": null
  }
}
```

## Connection Pool

The connection pool is configured with:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds

Adjust these in `lib/db.ts` if needed.
