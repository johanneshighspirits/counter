import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, getEventRef, getTeamRef } from '@/lib/firebase-server';
import { eventCookieOptions } from '@/lib/admin-auth';
import { getEventPinRef, hashPin, PIN_PATTERN } from '@/lib/event-pin';
import { isValidDate } from '@/lib/event-date';

// Top-level paths that a team slug must not shadow
const RESERVED_TEAM_SLUGS = new Set(['admin', 'api']);

const toAscii = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// "Team 17" -> "team17". No separators, so "Team 17" and "team17" are the
// same team.
const teamSlugify = (name: string) =>
  toAscii(name).replace(/[^a-z0-9]+/g, '').slice(0, 30);

// "Skridsko disco!" -> "skridsko-disco"
const eventSlugify = (name: string) =>
  toAscii(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '') || 'event';

const isAlreadyExists = (err: unknown) =>
  (err as { code?: unknown })?.code === 6; // gRPC ALREADY_EXISTS

const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

export async function POST(request: NextRequest) {
  try {
    const { teamName, eventName, date, pin } = await request.json();
    const trimmedTeamName = typeof teamName === 'string' ? teamName.trim() : '';
    const trimmedEventName =
      typeof eventName === 'string' ? eventName.trim() : '';
    const teamSlug = teamSlugify(trimmedTeamName);

    if (!teamSlug || trimmedTeamName.length > 40) {
      return badRequest('Laget måste ha ett namn med bokstäver eller siffror');
    }
    if (RESERVED_TEAM_SLUGS.has(teamSlug)) {
      return badRequest('Det lagnamnet går inte att använda');
    }
    if (!trimmedEventName || trimmedEventName.length > 60) {
      return badRequest('Evenemanget måste ha ett namn på 1–60 tecken');
    }
    if (!isValidDate(date)) {
      return badRequest('Evenemanget måste ha ett datum');
    }
    if (typeof pin !== 'string' || !PIN_PATTERN.test(pin)) {
      return badRequest('PIN-koden måste vara 4–8 siffror');
    }

    const pinHash = await hashPin(pin);
    const baseSlug = eventSlugify(trimmedEventName);
    const teamRef = getTeamRef(teamSlug);
    const isNewTeam = !(await teamRef.get()).exists;

    // Try "skridskodisco", then "skridskodisco-2", "skridskodisco-3", ...
    for (let attempt = 1; attempt <= 20; attempt++) {
      const eventSlug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

      const batch = getAdminDb().batch();
      if (isNewTeam) {
        // merge, so a team created at the same moment isn't overwritten
        batch.set(teamRef, { name: trimmedTeamName }, { merge: true });
      }
      batch.create(getEventRef(teamSlug, eventSlug), {
        name: trimmedEventName,
        date,
        count: 0,
        maxCount: 150,
        ticketsSold: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.set(getEventPinRef(teamSlug, eventSlug), { pinHash });

      try {
        await batch.commit();
      } catch (err) {
        if (isAlreadyExists(err)) {
          continue;
        }
        throw err;
      }

      // Log the creator straight into the new event's admin page
      const response = NextResponse.json(
        { teamSlug, eventSlug },
        { status: 201 },
      );
      response.cookies.set(eventCookieOptions(teamSlug, eventSlug, pinHash));
      return response;
    }

    return NextResponse.json(
      { error: 'Kunde inte hitta en ledig länk, prova ett annat namn' },
      { status: 409 },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
