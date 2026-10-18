import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { toEventDate } from '@/lib/event-date';
import type { LogEntry } from '@/lib/occupancy';

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
  // "YYYY-MM-DD"
  date: string;
  createdAt: number | null;
};

export const getTeamRef = (teamSlug: string) =>
  getAdminDb().collection('teams').doc(teamSlug);

export const getEventRef = (teamSlug: string, eventSlug: string) =>
  getTeamRef(teamSlug).collection('events').doc(eventSlug);

// Cached per request, since layouts, pages and titles all load it
export const getTeam = cache(
  async (teamSlug: string): Promise<Team | null> => {
    const snapshot = await getTeamRef(teamSlug).get();
    const data = snapshot.data();
    return data ? { slug: snapshot.id, name: data.name } : null;
  },
);

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

  const createdAt =
    (data.createdAt as Timestamp | undefined)?.toMillis() ?? null;

  return {
    teamSlug,
    slug: snapshot.id,
    name: data.name,
    count: data.count ?? 0,
    maxCount: data.maxCount ?? 0,
    ticketsSold: data.ticketsSold ?? 0,
    // Events created before dates were added fall back to their creation day
    date: data.date ?? toEventDate(createdAt ?? Date.now()),
    createdAt,
  };
};

// Cached per request, since the event layout and its pages both load it
export const getEvent = cache(
  async (teamSlug: string, eventSlug: string): Promise<TeamEvent | null> =>
    toTeamEvent(teamSlug, await getEventRef(teamSlug, eventSlug).get()),
);

// "Julmarknad · Team 16", the base of every event page title
export async function getEventTitle(teamSlug: string, eventSlug: string) {
  const [team, event] = await Promise.all([
    getTeam(teamSlug),
    getEvent(teamSlug, eventSlug),
  ]);
  return `${event?.name ?? eventSlug} · ${team?.name ?? teamSlug}`;
}

// Latest date first, then newest created
export async function getTeamEvents(teamSlug: string): Promise<TeamEvent[]> {
  const snapshot = await getTeamRef(teamSlug).collection('events').get();
  return snapshot.docs
    .map((event) => toTeamEvent(teamSlug, event)!)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (b.createdAt ?? 0) - (a.createdAt ?? 0),
    );
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
  expireEventLog(teamSlug, eventSlug);
}

// Delete the event with its log and PIN, and the team too if this was its
// last event. Returns whether the team was deleted.
export async function deleteEvent(
  teamSlug: string,
  eventSlug: string,
): Promise<boolean> {
  const teamRef = getTeamRef(teamSlug);
  await getAdminDb().recursiveDelete(getEventRef(teamSlug, eventSlug));
  expireEventLog(teamSlug, eventSlug);

  // In a transaction, so an event created in the team meanwhile keeps it
  return getAdminDb().runTransaction(async (transaction) => {
    const remaining = await transaction.get(
      teamRef.collection('events').limit(1),
    );
    if (!remaining.empty) {
      return false;
    }
    transaction.delete(teamRef);
    return true;
  });
}

export type LogSummary = {
  entries: number;
  first: number | null;
  last: number | null;
};

export async function getLogSummary(
  teamSlug: string,
  eventSlug: string,
): Promise<LogSummary> {
  const log = getEventRef(teamSlug, eventSlug).collection('log');
  const timeOf = (snapshot: FirebaseFirestore.QuerySnapshot) =>
    (snapshot.docs[0]?.get('createdAt') as Timestamp | undefined)?.toMillis() ??
    null;

  const [count, first, last] = await Promise.all([
    log.count().get(),
    log.orderBy('createdAt').limit(1).get(),
    log.orderBy('createdAt', 'desc').limit(1).get(),
  ]);

  return {
    entries: count.data().count,
    first: timeOf(first),
    last: timeOf(last),
  };
}

// Delete log entries outside [keepFrom, keepTo], e.g. test clicks made while
// setting up an event days ahead. Counters are left as they are.
export async function trimEventLog(
  teamSlug: string,
  eventSlug: string,
  keepFrom: number,
  keepTo: number | null,
): Promise<number> {
  const log = getEventRef(teamSlug, eventSlug).collection('log');
  const snapshots = await Promise.all([
    log.where('createdAt', '<', Timestamp.fromMillis(keepFrom)).get(),
    keepTo === null
      ? null
      : log.where('createdAt', '>', Timestamp.fromMillis(keepTo)).get(),
  ]);
  const docs = snapshots.flatMap((snapshot) => snapshot?.docs ?? []);

  const writer = getAdminDb().bulkWriter();
  for (const doc of docs) {
    writer.delete(doc.ref);
  }
  await writer.close();
  expireEventLog(teamSlug, eventSlug);

  return docs.length;
}

const eventLogTag = (teamSlug: string, eventSlug: string) =>
  `event-log:${teamSlug}/${eventSlug}`;

// Drop the cached log right away, after entries were deleted
const expireEventLog = (teamSlug: string, eventSlug: string) =>
  revalidateTag(eventLogTag(teamSlug, eventSlug), { expire: 0 });

// The whole log, cached for a minute so stats viewers and tab switches share
// one read of it. The stats page listens for entries newer than the cached
// ones, so nothing is missed.
export const getCachedEventLog = (teamSlug: string, eventSlug: string) =>
  unstable_cache(
    () => getEventLog(teamSlug, eventSlug),
    ['event-log', teamSlug, eventSlug],
    { tags: [eventLogTag(teamSlug, eventSlug)], revalidate: 60 },
  )();

// The whole log, oldest first
export async function getEventLog(
  teamSlug: string,
  eventSlug: string,
): Promise<LogEntry[]> {
  const snapshot = await getEventRef(teamSlug, eventSlug)
    .collection('log')
    .orderBy('createdAt')
    .get();

  return snapshot.docs.map((entry) => ({
    id: entry.id,
    type: entry.get('type'),
    delta: entry.get('delta'),
    createdAt: (entry.get('createdAt') as Timestamp).toMillis(),
  }));
}
