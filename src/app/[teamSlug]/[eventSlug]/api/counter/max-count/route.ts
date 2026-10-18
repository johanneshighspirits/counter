import { getEvent, getEventRef } from '@/lib/firebase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth';
import { MAX_MAX_COUNT } from '@/lib/event-limits';

export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[teamSlug]/[eventSlug]/api/counter/max-count'>,
) {
  const { teamSlug, eventSlug } = await params;
  if (!(await isAdmin(teamSlug, eventSlug))) {
    return unauthorizedResponse();
  }

  try {
    const { maxCount } = await request.json();

    if (
      !Number.isInteger(maxCount) ||
      maxCount < 1 ||
      maxCount > MAX_MAX_COUNT
    ) {
      return NextResponse.json(
        {
          error: `Max count must be a whole number from 1 to ${MAX_MAX_COUNT}`,
        },
        { status: 400 },
      );
    }

    if (!(await getEvent(teamSlug, eventSlug))) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update maxCount
    await getEventRef(teamSlug, eventSlug).update({ maxCount });

    return NextResponse.json(
      {
        success: true,
        message: `Max count updated to ${maxCount}`,
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
