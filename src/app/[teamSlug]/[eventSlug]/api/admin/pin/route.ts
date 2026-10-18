import { NextRequest, NextResponse } from 'next/server';
import { isGlobalAdmin, unauthorizedResponse } from '@/lib/admin-auth';
import { PIN_PATTERN, setEventPin } from '@/lib/event-pin';
import { getEvent } from '@/lib/firebase-server';

// Change an event's PIN. ADMIN_PASSWORD only, so someone who knows the
// current PIN can't lock others out by changing it.
export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[teamSlug]/[eventSlug]/api/admin/pin'>,
) {
  if (!(await isGlobalAdmin())) {
    return unauthorizedResponse();
  }

  try {
    const { teamSlug, eventSlug } = await params;
    const { pin } = await request.json();

    if (typeof pin !== 'string' || !PIN_PATTERN.test(pin)) {
      return NextResponse.json(
        { error: 'The PIN must be 4–8 digits' },
        { status: 400 },
      );
    }

    if (!(await getEvent(teamSlug, eventSlug))) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await setEventPin(teamSlug, eventSlug, pin);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
