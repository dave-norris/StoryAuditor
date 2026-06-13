import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { withUserTransaction } from '@/lib/db';
import { resolveUserId } from '@/lib/queries/dashboard/resolveUserId';
import { getSettings } from '@/lib/queries/dashboard/getSettings';
import { upsertSettings } from '@/lib/queries/dashboard/upsertSettings';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const internalId = await resolveUserId(userId);

    if (!internalId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = await withUserTransaction(internalId, async (client) => {
      return getSettings(client);
    });

    return NextResponse.json({ maxDashboardItems: settings.maxDashboardItems });
  } catch (error) {
    console.error('Error fetching dashboard settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const internalId = await resolveUserId(userId);

    if (!internalId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const value = body.maxDashboardItems;

    if (!Number.isInteger(value) || value < 5 || value > 50) {
      return NextResponse.json(
        { error: 'maxDashboardItems must be an integer between 5 and 50' },
        { status: 400 }
      );
    }

    const settings = await withUserTransaction(internalId, async (client) => {
      return upsertSettings(client, internalId, value);
    });

    return NextResponse.json({ maxDashboardItems: settings.maxDashboardItems });
  } catch (error) {
    console.error('Error updating dashboard settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
