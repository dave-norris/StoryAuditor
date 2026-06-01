# Migration from Prisma to node-postgres (pg)

## What Changed

### Removed
- ❌ `@prisma/client` dependency
- ❌ `prisma` dev dependency
- ❌ `prisma/` directory (schema.prisma, migrations/)
- ❌ Prisma-related npm scripts

### Added
- ✅ `pg` dependency (node-postgres)
- ✅ `@types/pg` dev dependency
- ✅ `migrations/` directory with SQL files
- ✅ `scripts/migrate.ts` for running migrations
- ✅ New `lib/db.ts` using pg Pool instead of Prisma Client

### Updated
- 📝 `package.json` - Removed Prisma scripts, added migration runner
- 📝 `app/api/health/route.ts` - Uses new pg-based database module
- 📝 `.env` - Clarified Railway configuration

## Key Differences

### Before (Prisma)
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.$queryRaw`SELECT 1`;
```

### After (pg)
```typescript
import { query } from '@/lib/db';
const result = await query('SELECT 1');
```

## Migration Management

### Before (Prisma)
```bash
npx prisma migrate dev
npx prisma migrate deploy
```

### After (pg)
```bash
npx ts-node scripts/migrate.ts
```

Migrations are SQL files in `migrations/` directory, tracked in `_migrations` table.

## Benefits

1. **Simpler debugging** - Direct SQL, no ORM abstraction
2. **Fewer dependencies** - Smaller bundle size
3. **No version conflicts** - No Prisma major version upgrades needed
4. **Better Railway support** - Direct control over connection strings
5. **Easier to understand** - Standard PostgreSQL client, not proprietary ORM

## Testing

Build succeeds:
```bash
pnpm run build
✓ Compiled successfully
```

Health check endpoint works:
```bash
curl http://localhost:3000/api/health
```

## Next Steps

1. Deploy to Railway
2. Verify migrations run on startup
3. Test health check endpoint
4. Monitor connection pool usage

## Rollback

If needed to revert to Prisma:
1. Restore `prisma/` directory from git
2. `pnpm add @prisma/client prisma`
3. Update `lib/db.ts` to use Prisma Client
4. Update `package.json` scripts
