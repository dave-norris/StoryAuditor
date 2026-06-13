import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { getTrashItems } from '@/lib/queries/dashboard/getTrashItems';
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

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor') || null;
  const limitParam = searchParams.get('limit');

  try {
    const result = await withUserTransaction(internalId, async (client) => {
      let limit: number;
      if (limitParam) {
        limit = Math.max(1, parseInt(limitParam, 10) || 10);
      } else {
        const settings = await getSettings(client);
        limit = settings.maxDashboardItems;
      }

      return getTrashItems(client, cursor, limit);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching trash items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
