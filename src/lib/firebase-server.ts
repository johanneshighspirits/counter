import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Uses the service account from FIREBASE_SERVICE_ACCOUNT_KEY when set.
// Without it, firebase-admin falls back to application default credentials,
// or to the emulator when FIRESTORE_EMULATOR_HOST is set.
const getAdminApp = () => {
  if (getApps().length) {
    return getApp();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  return initializeApp(
    serviceAccountKey
      ? { credential: cert(JSON.parse(serviceAccountKey)) }
      : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
  );
};

export const getAdminDb = () => getFirestore(getAdminApp());

export type Team = {
  slug: string;
  name: string;
};

export type TeamEvent = {
  teamSlug: string;
  slug: string;
  name: string;
  count: number;
  maxCount: number;
  ticketsSold: number;
  createdAt: number | null;
};

export const getTeamRef = (teamSlug: string) =>
  getAdminDb().collection('teams').doc(teamSlug);

export const getEventRef = (teamSlug: string, eventSlug: string) =>
  getTeamRef(teamSlug).collection('events').doc(eventSlug);

export async function getTeam(teamSlug: string): Promise<Team | null> {
  const snapshot = await getTeamRef(teamSlug).get();
  const data = snapshot.data();
  return data ? { slug: snapshot.id, name: data.name } : null;
}

export async function getTeams(): Promise<Team[]> {
  const snapshot = await getAdminDb().collection('teams').get();
  return snapshot.docs
    .map((team) => ({ slug: team.id, name: team.get('name') as string }))
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}

const toTeamEvent = (
  teamSlug: string,
  snapshot: FirebaseFirestore.DocumentSnapshot,
): TeamEvent | null => {
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  return {
    teamSlug,
    slug: snapshot.id,
    name: data.name,
    count: data.count ?? 0,
    maxCount: data.maxCount ?? 0,
    ticketsSold: data.ticketsSold ?? 0,
    createdAt: (data.createdAt as Timestamp | undefined)?.toMillis() ?? null,
  };
};

export async function getEvent(
  teamSlug: string,
  eventSlug: string,
): Promise<TeamEvent | null> {
  return toTeamEvent(teamSlug, await getEventRef(teamSlug, eventSlug).get());
}

// Newest first
export async function getTeamEvents(teamSlug: string): Promise<TeamEvent[]> {
  const snapshot = await getTeamRef(teamSlug).collection('events').get();
  return snapshot.docs
    .map((event) => toTeamEvent(teamSlug, event)!)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export type TeamWithEvents = Team & { events: TeamEvent[] };

export async function getTeamsWithEvents(): Promise<TeamWithEvents[]> {
  const teams = await getTeams();
  return Promise.all(
    teams.map(async (team) => ({
      ...team,
      events: await getTeamEvents(team.slug),
    })),
  );
}

// Set both counters to 0 and clear the log
export async function resetEvent(teamSlug: string, eventSlug: string) {
  const eventRef = getEventRef(teamSlug, eventSlug);
  await eventRef.update({ count: 0, ticketsSold: 0 });

  try {
    await getAdminDb().recursiveDelete(eventRef.collection('log'));
  } catch (error) {
    console.error(`Could not clear counter log for ${teamSlug}/${eventSlug}`);
    console.error(error);
  }
}

export type OccupancyByMinute = {
  minute: string;
  entries: number;
  exits: number;
  people_inside: number;
  tickets_sold: number;
};

const MINUTE_MS = 60_000;

// Entries and exits per minute, plus people inside and tickets sold at the
// end of each minute, for the last 6 hours
export async function getOccupancyByMinute(
  teamSlug: string,
  eventSlug: string,
): Promise<OccupancyByMinute[]> {
  const since = Timestamp.fromMillis(Date.now() - 6 * 60 * MINUTE_MS);
  const snapshot = await getEventRef(teamSlug, eventSlug)
    .collection('log')
    .where('createdAt', '>=', since)
    .orderBy('createdAt')
    .get();

  const events = snapshot.docs
    .map((entry) => entry.data())
    .filter((entry) => entry.createdAt)
    .map((entry) => ({
      type: entry.type as 'occupancy' | 'tickets',
      minuteMs:
        Math.floor((entry.createdAt as Timestamp).toMillis() / MINUTE_MS) *
        MINUTE_MS,
      delta: entry.delta as number,
      newCount: entry.newCount as number,
    }));

  if (events.length === 0) {
    return [];
  }

  // Values just before the first event of each type in the window
  const firstOf = (type: string) => events.find((e) => e.type === type);
  const firstOccupancy = firstOf('occupancy');
  const firstTickets = firstOf('tickets');
  let peopleInside = firstOccupancy
    ? Math.max(0, firstOccupancy.newCount - firstOccupancy.delta)
    : 0;
  let ticketsSold = firstTickets
    ? Math.max(0, firstTickets.newCount - firstTickets.delta)
    : 0;

  const result: OccupancyByMinute[] = [];
  let eventIndex = 0;

  for (
    let minuteMs = events[0].minuteMs;
    minuteMs <= events[events.length - 1].minuteMs;
    minuteMs += MINUTE_MS
  ) {
    let entries = 0;
    let exits = 0;

    while (
      eventIndex < events.length &&
      events[eventIndex].minuteMs === minuteMs
    ) {
      const event = events[eventIndex];
      if (event.type === 'occupancy') {
        if (event.delta > 0) entries += event.delta;
        if (event.delta < 0) exits += Math.abs(event.delta);
        peopleInside = event.newCount;
      } else {
        ticketsSold = event.newCount;
      }
      eventIndex++;
    }

    result.push({
      minute: new Date(minuteMs).toISOString(),
      entries,
      exits,
      people_inside: peopleInside,
      tickets_sold: ticketsSold,
    });
  }

  return result;
}
