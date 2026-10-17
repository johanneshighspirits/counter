import { getAdminDb, getEvent, getEventRef } from '@/lib/firebase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[teamSlug]/[eventSlug]/api/counter/reset'>,
) {
  const { teamSlug, eventSlug } = await params;
  if (!(await isAdmin(teamSlug, eventSlug))) {
    return unauthorizedResponse();
  }

  try {
    if (!(await getEvent(teamSlug, eventSlug))) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventRef = getEventRef(teamSlug, eventSlug);

    // Reset counter and ticketsSold to 0
    await eventRef.update({ count: 0, ticketsSold: 0 });

    try {
      await getAdminDb().recursiveDelete(eventRef.collection('log'));
    } catch (error) {
      console.error('Could not clear counter log');
      console.error(error);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Counter reset to 0',
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
