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

export type Project = {
  slug: string;
  name: string;
  count: number;
  maxCount: number;
  ticketsSold: number;
};

export const getProjectRef = (projectSlug: string) =>
  getAdminDb().collection('projects').doc(projectSlug);

export async function getProject(projectSlug: string): Promise<Project | null> {
  const snapshot = await getProjectRef(projectSlug).get();
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  return {
    slug: snapshot.id,
    name: data.name,
    count: data.count ?? 0,
    maxCount: data.maxCount ?? 0,
    ticketsSold: data.ticketsSold ?? 0,
  };
}

export type OccupancyByMinute = {
  minute: string;
  entries: number;
  exits: number;
  people_inside: number;
};

const MINUTE_MS = 60_000;

// Entries, exits and people inside per minute for the last 6 hours
export async function getOccupancyByMinute(
  projectSlug: string,
): Promise<OccupancyByMinute[]> {
  const since = Timestamp.fromMillis(Date.now() - 6 * 60 * MINUTE_MS);
  const snapshot = await getProjectRef(projectSlug)
    .collection('log')
    .where('createdAt', '>=', since)
    .orderBy('createdAt')
    .get();

  const events = snapshot.docs
    .map((entry) => entry.data())
    .filter((entry) => entry.type === 'occupancy')
    .map((entry) => ({
      minuteMs:
        Math.floor((entry.createdAt as Timestamp).toMillis() / MINUTE_MS) *
        MINUTE_MS,
      delta: entry.delta as number,
      newCount: entry.newCount as number,
    }));

  if (events.length === 0) {
    return [];
  }

  const result: OccupancyByMinute[] = [];
  let eventIndex = 0;
  let peopleInside = 0;

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
      if (event.delta > 0) entries += event.delta;
      if (event.delta < 0) exits += Math.abs(event.delta);
      peopleInside = event.newCount;
      eventIndex++;
    }

    result.push({
      minute: new Date(minuteMs).toISOString(),
      entries,
      exits,
      people_inside: peopleInside,
    });
  }

  return result;
}
