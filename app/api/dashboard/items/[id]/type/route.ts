import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { toggleType } from '@/lib/queries/dashboard/toggleType';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const internalId = await resolveUserId(userId);

    if (!internalId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { newType } = body;

    if (newType !== 'series' && newType !== 'group') {
      return NextResponse.json(
        { error: 'newType must be one of: series, group' },
        { status: 400 }
      );
    }

    const result = await withUserTransaction(internalId, async (client) => {
      return toggleType(client, id, newType);
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Cannot toggle type of non-active container' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, type: result.type });
  } catch (error) {
    console.error('Error toggling container type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
