'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getFirestore,
  runTransaction,
  serverTimestamp,
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
    dbInstance = getFirestore(app);

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

// Atomically change a counter (clamped to 0) and write a log entry
export async function updateCounter(
  teamSlug: string,
  eventSlug: string,
  eventType: LogEventType,
  delta: number,
  source: string,
): Promise<number> {
  const db = getDb();
  const eventRef = doc(db, 'teams', teamSlug, 'events', eventSlug);
  const field = fieldByEventType[eventType];

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(eventRef);
    if (!snapshot.exists()) {
      throw new Error('Event not found');
    }

    const newValue = Math.max(0, (snapshot.get(field) ?? 0) + delta);

    transaction.update(eventRef, { [field]: newValue });
    transaction.set(doc(collection(eventRef, 'log')), {
      type: eventType,
      delta,
      newCount: newValue,
      source,
      createdAt: serverTimestamp(),
    });

    return newValue;
  });
}
