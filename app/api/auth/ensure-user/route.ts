import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { userExists } from '@/lib/queries/userExists';
import { createUser } from '@/lib/queries/createUser';

/**
 * POST /api/auth/ensure-user
 * Checks if the logged-in Clerk user exists in the database.
 * If not, creates the record. Returns { exists: boolean, created: boolean }.
 */
export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const exists = await userExists(userId);

    if (exists) {
      return NextResponse.json({ exists: true, created: false });
    }

    // Fetch full user details from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Could not fetch user details' }, { status: 500 });
    }

    await createUser({
      authId: userId,
      name: clerkUser.firstName ?? clerkUser.username ?? 'User',
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
    });

    return NextResponse.json({ exists: false, created: true });
  } catch (error) {
    console.error('Error in ensure-user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
