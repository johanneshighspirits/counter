import { getEvent, trimEventLog } from '@/lib/firebase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth';
import { DATE_TIME_PATTERN, fromEventDateTime } from '@/lib/event-date';

const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

// Body: { keepFrom: "2026-10-18T17:00", keepTo?: "2026-10-18T23:00" },
// in Swedish time
export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[teamSlug]/[eventSlug]/api/counter/trim-log'>,
) {
  const { teamSlug, eventSlug } = await params;
  if (!(await isAdmin(teamSlug, eventSlug))) {
    return unauthorizedResponse();
  }

  try {
    const { keepFrom, keepTo } = await request.json();

    if (typeof keepFrom !== 'string' || !DATE_TIME_PATTERN.test(keepFrom)) {
      return badRequest('Invalid start time');
    }
    if (
      keepTo != null &&
      (typeof keepTo !== 'string' || !DATE_TIME_PATTERN.test(keepTo))
    ) {
      return badRequest('Invalid end time');
    }

    const from = fromEventDateTime(keepFrom);
    // Keep the whole end minute
    const to = keepTo == null ? null : fromEventDateTime(keepTo) + 59_999;
    if (Number.isNaN(from) || (to !== null && (Number.isNaN(to) || to < from))) {
      return badRequest('The end time must be after the start time');
    }

    if (!(await getEvent(teamSlug, eventSlug))) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const deleted = await trimEventLog(teamSlug, eventSlug, from, to);

    return NextResponse.json({ success: true, deleted }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
