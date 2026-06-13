import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { restoreItem } from '@/lib/queries/dashboard/restoreItem';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const internalId = await resolveUserId(clerkId);
  if (!internalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { source?: string; includeBooks?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { source, includeBooks } = body;

  if (source !== 'series' && source !== 'book') {
    return NextResponse.json(
      { error: 'Invalid source. Must be "series" or "book".' },
      { status: 400 }
    );
  }

  try {
    const result = await withUserTransaction(internalId, async (client) => {
      return restoreItem(client, id, source, includeBooks);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error restoring trash item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
