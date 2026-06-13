import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { getItems } from '@/lib/queries/dashboard/getItems';
import { getSettings } from '@/lib/queries/dashboard/getSettings';

export async function GET(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const internalId = await resolveUserId(clerkId);
  if (!internalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') === 'archived' ? 'archived' : 'active';
  const cursor = searchParams.get('cursor') || null;
  const limitParam = searchParams.get('limit');

  try {
    const result = await withUserTransaction(internalId, async (client) => {
      // Determine the effective limit
      let limit: number;
      if (limitParam) {
        limit = Math.max(1, parseInt(limitParam, 10) || 10);
      } else {
        const settings = await getSettings(client);
        limit = settings.maxDashboardItems;
      }

      const archived = view === 'archived';
      return getItems(client, archived, cursor, limit);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dashboard items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
