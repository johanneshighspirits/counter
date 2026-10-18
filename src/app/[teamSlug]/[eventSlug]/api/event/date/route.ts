import { getEvent, getEventRef } from '@/lib/firebase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth';
import { isValidDate } from '@/lib/event-date';

export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[teamSlug]/[eventSlug]/api/event/date'>,
) {
  const { teamSlug, eventSlug } = await params;
  if (!(await isAdmin(teamSlug, eventSlug))) {
    return unauthorizedResponse();
  }

  try {
    const { date } = await request.json();

    if (!isValidDate(date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    if (!(await getEvent(teamSlug, eventSlug))) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await getEventRef(teamSlug, eventSlug).update({ date });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
