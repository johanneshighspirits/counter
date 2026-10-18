import { NextResponse } from 'next/server';
import { isGlobalAdmin, unauthorizedResponse } from '@/lib/admin-auth';
import { getTeamsWithEvents, resetEvent } from '@/lib/firebase-server';

// Reset every event of every team. ADMIN_PASSWORD only.
export async function POST() {
  if (!(await isGlobalAdmin())) {
    return unauthorizedResponse();
  }

  try {
    const teams = await getTeamsWithEvents();
    const events = teams.flatMap((team) => team.events);

    await Promise.all(
      events.map((event) => resetEvent(event.teamSlug, event.slug)),
    );

    return NextResponse.json(
      { success: true, message: `Reset ${events.length} events` },
      { status: 200 },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
