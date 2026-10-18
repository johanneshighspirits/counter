'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  increment,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const emulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (!firebaseConfig.projectId) {
    throw new Error(
      'Missing Firebase environment variables. Please check your .env.local file.',
    );
  }

  if (!dbInstance) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    // Kept in IndexedDB, so clicks made without a connection are sent when
    // it's back, even if the page was closed in between. Without IndexedDB
    // (e.g. some private modes) Firestore falls back to memory, and queued
    // clicks are only sent while the page stays open.
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    if (emulatorHost) {
      const [host, port] = emulatorHost.split(':');
      connectFirestoreEmulator(dbInstance, host, Number(port));
    }
  }

  return dbInstance;
}

export type LogEventType = 'occupancy' | 'tickets';

const fieldByEventType = {
  occupancy: 'count',
  tickets: 'ticketsSold',
} as const;

// Change a counter and write a log entry in one write. Unlike a transaction
// it doesn't need a connection: Firestore applies it to the local cache right
// away and sends it when it can. Resolves once the server has it, which can be
// much later.
//
// The security rules require the event's lastLogId to name the new entry, and
// the entry's delta to match the change, so every change is logged. They also
// keep counters from going below 0, so a decrement at 0 is rejected.
export function updateCounter(
  teamSlug: string,
  eventSlug: string,
  eventType: LogEventType,
  delta: number,
  source: string,
): Promise<void> {
  const db = getDb();
  const eventRef = doc(db, 'teams', teamSlug, 'events', eventSlug);
  const logRef = doc(collection(eventRef, 'log'));

  const batch = writeBatch(db);
  batch.update(eventRef, {
    [fieldByEventType[eventType]]: increment(delta),
    lastLogId: logRef.id,
  });
  batch.set(logRef, {
    type: eventType,
    delta,
    source,
    createdAt: serverTimestamp(),
  });
  return batch.commit();
}
