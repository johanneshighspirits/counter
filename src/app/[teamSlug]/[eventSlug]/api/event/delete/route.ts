import { deleteEvent, getEvent } from '@/lib/firebase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth';

// Delete the event, its log and PIN. The event's PIN or ADMIN_PASSWORD.
export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[teamSlug]/[eventSlug]/api/event/delete'>,
) {
  const { teamSlug, eventSlug } = await params;
  if (!(await isAdmin(teamSlug, eventSlug))) {
    return unauthorizedResponse();
  }

  try {
    if (!(await getEvent(teamSlug, eventSlug))) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const teamDeleted = await deleteEvent(teamSlug, eventSlug);

    return NextResponse.json({ success: true, teamDeleted }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
