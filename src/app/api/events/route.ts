import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, getEventRef, getTeamRef } from '@/lib/firebase-server';
import { eventCookieOptions } from '@/lib/admin-auth';
import { getEventPinRef, hashPin, PIN_PATTERN } from '@/lib/event-pin';
import { isValidDate } from '@/lib/event-date';
import { E2E_TEAM_SLUG, isE2eTeam } from '@/lib/e2e';

// Keeps a shared link from being used to fill the database. Admins free up
// spots by deleting old events.
const MAX_EVENTS_PER_TEAM = 20;
const MAX_TEAMS = 20;

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

    const baseSlug = eventSlugify(trimmedEventName);
    const teamRef = getTeamRef(teamSlug);
    const isNewTeam = !(await teamRef.get()).exists;

    // The e2e team neither counts toward the cap nor is limited by it
    if (isNewTeam && !isE2eTeam(teamSlug)) {
      const [teams, e2eTeam] = await Promise.all([
        getAdminDb().collection('teams').count().get(),
        getTeamRef(E2E_TEAM_SLUG).get(),
      ]);
      const realTeams = teams.data().count - (e2eTeam.exists ? 1 : 0);
      if (realTeams >= MAX_TEAMS) {
        return NextResponse.json(
          {
            error: `Det finns redan ${MAX_TEAMS} lag, så nya lag kan inte skapas just nu. Välj ett befintligt lag i listan.`,
          },
          { status: 409 },
        );
      }
    } else if (!isNewTeam) {
      const events = await teamRef.collection('events').count().get();
      if (events.data().count >= MAX_EVENTS_PER_TEAM) {
        return NextResponse.json(
          {
            error: `Laget har redan ${MAX_EVENTS_PER_TEAM} evenemang. Ta bort ett gammalt under dess admin-sida först.`,
          },
          { status: 409 },
        );
      }
    }

    // After the caps, so refused requests don't cost a slow hash
    const pinHash = await hashPin(pin);

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
