import { getEvent, resetEvent } from '@/lib/firebase-server';
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

    await resetEvent(teamSlug, eventSlug);

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
