import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { emptyTrash } from '@/lib/queries/dashboard/emptyTrash';

export async function DELETE() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const internalId = await resolveUserId(clerkId);
  if (!internalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await withUserTransaction(internalId, async (client) => {
      return emptyTrash(client);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error emptying trash:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
