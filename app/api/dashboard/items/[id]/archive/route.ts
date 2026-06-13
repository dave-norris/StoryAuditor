import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { archiveItem } from '@/lib/queries/dashboard/archiveItem';

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
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const { source, archive, includeBooks } = body;

    if (source !== 'series' && source !== 'book') {
      return NextResponse.json(
        { error: 'source must be one of: series, book' },
        { status: 400 }
      );
    }

    if (typeof archive !== 'boolean') {
      return NextResponse.json(
        { error: 'archive must be a boolean' },
        { status: 400 }
      );
    }

    const result = await withUserTransaction(internalId, async (client) => {
      return archiveItem(client, id, source, archive, includeBooks);
    });

    return NextResponse.json({ success: result.success, archivedCount: result.archivedCount });
  } catch (error) {
    console.error('Error archiving/unarchiving item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
