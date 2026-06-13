import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { softDeleteItem } from '@/lib/queries/dashboard/softDeleteItem';

export async function DELETE(
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
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const { source, mode } = body;

    if (source !== 'series' && source !== 'book') {
      return NextResponse.json(
        { error: 'source must be one of: series, book' },
        { status: 400 }
      );
    }

    if (source === 'series' && mode !== undefined && mode !== 'delete_all' && mode !== 'keep_books') {
      return NextResponse.json(
        { error: 'mode must be one of: delete_all, keep_books' },
        { status: 400 }
      );
    }

    const result = await withUserTransaction(internalId, async (client) => {
      return softDeleteItem(client, id, source, mode);
    });

    return NextResponse.json({ success: result.success, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error soft-deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
