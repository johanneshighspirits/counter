// Security rules tests, run against the Firestore emulator with
// firestore.rules: npm run test:rules (needs Java 21+ for the emulator)
//
// Writes go through the client SDK the way browsers make them, and the
// test data is set up with firebase-admin, which the rules don't apply to.

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc,
  setLogLevel,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteApp as deleteAdminApp,
  initializeApp as initializeAdminApp,
} from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// Denied writes are what most tests expect, so don't log them
setLogLevel('silent');

const projectId = 'demo-counter';
const [host, port] = (
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'
).split(':');

const adminApp = initializeAdminApp({ projectId }, 'admin');
const adminDb = getAdminFirestore(adminApp);

// Two browsers, e.g. two door devices
const apps = ['door-1', 'door-2'].map((name) =>
  initializeApp({ projectId, apiKey: 'test' }, name),
);
const [db, db2] = apps.map((app) => {
  const firestore = getFirestore(app);
  connectFirestoreEmulator(firestore, host, Number(port));
  return firestore;
});

const EVENT = 'teams/t/events/e';
const eventRef = (database = db) => doc(database, EVENT);
const logEntry = (fields) => ({
  type: 'occupancy',
  delta: 1,
  source: 'main-door',
  createdAt: serverTimestamp(),
  ...fields,
});

// The same transaction as updateCounter in src/lib/firebase.ts
const updateCounter = (type, delta, { database = db, source } = {}) =>
  runTransaction(database, async (transaction) => {
    const ref = eventRef(database);
    const snapshot = await transaction.get(ref);
    const field = type === 'occupancy' ? 'count' : 'ticketsSold';
    const newValue = Math.max(0, (snapshot.get(field) ?? 0) + delta);
    const logRef = doc(collection(ref, 'log'));
    transaction.update(ref, { [field]: newValue, lastLogId: logRef.id });
    transaction.set(logRef, {
      type,
      delta,
      newCount: newValue,
      source: source ?? (type === 'occupancy' ? 'main-door' : 'ticket_office'),
      createdAt: serverTimestamp(),
    });
  });

// A batch with an event update and log entries, for hand-made writes
const commitBatch = (build) => {
  const batch = writeBatch(db);
  build(batch);
  return batch.commit();
};

const counters = async () => (await adminDb.doc(EVENT).get()).data();

const allowed = (write) => assert.doesNotReject(write);
const denied = (write) =>
  assert.rejects(write, (err) => err.code === 'permission-denied');

before(async () => {
  await adminDb.recursiveDelete(adminDb.collection('teams'));
  await adminDb.doc('teams/t').set({ name: 'T' });
  await adminDb
    .doc(EVENT)
    .set({ name: 'E', count: 0, ticketsSold: 0, maxCount: 150 });
  await adminDb.doc(`${EVENT}/log/old`).set({
    type: 'occupancy',
    delta: 1,
    newCount: 1,
    source: 'main-door',
    createdAt: new Date(),
  });
});

after(async () => {
  await Promise.all(apps.map((app) => deleteApp(app)));
  await deleteAdminApp(adminApp);
});

test('clicks change the counters and write a log entry', async () => {
  await allowed(updateCounter('occupancy', 1));
  await allowed(updateCounter('occupancy', -1));
  // Clamped to 0, like the app
  await allowed(updateCounter('occupancy', -1));
  await allowed(updateCounter('tickets', 4));
  await allowed(updateCounter('tickets', -1));
  assert.deepEqual(
    {
      count: (await counters()).count,
      ticketsSold: (await counters()).ticketsSold,
    },
    { count: 0, ticketsSold: 3 },
  );
});

test('overlapping clicks on two devices are all counted', async () => {
  const before = (await counters()).count;
  const results = await Promise.allSettled([
    ...Array.from({ length: 8 }, () => updateCounter('occupancy', 1)),
    ...Array.from({ length: 8 }, () =>
      updateCounter('occupancy', 1, { database: db2 }),
    ),
  ]);
  assert.deepEqual(
    results.filter((result) => result.status === 'rejected'),
    [],
  );
  assert.equal((await counters()).count, before + 16);
});

test('anyone can read events and their log', async () => {
  await allowed(getDoc(eventRef()));
  await allowed(getDocs(collection(eventRef(), 'log')));
});

test('clicks outside what the buttons do are denied', async () => {
  await denied(updateCounter('tickets', 5));
  await denied(updateCounter('occupancy', 2));
  await denied(updateCounter('occupancy', 1, { source: 'x'.repeat(1000) }));
});

test('counters and the log only change together', async () => {
  await denied(
    addDoc(collection(eventRef(), 'log'), logEntry({ newCount: 1 })),
  );
  await denied(updateDoc(eventRef(), { count: 1 }));
  // Pointing at an entry that already exists
  await denied(updateDoc(eventRef(), { count: 1, lastLogId: 'old' }));
  await denied(
    commitBatch((batch) => {
      const first = doc(collection(eventRef(), 'log'));
      const second = doc(collection(eventRef(), 'log'));
      batch.update(eventRef(), { count: 1, lastLogId: first.id });
      batch.set(first, logEntry({ newCount: 1 }));
      batch.set(second, logEntry({ newCount: 1 }));
    }),
  );
});

test('counters can’t be set to arbitrary values', async () => {
  const { count } = await counters();
  await denied(
    commitBatch((batch) => {
      const entry = doc(collection(eventRef(), 'log'));
      batch.update(eventRef(), { count: count + 999, lastLogId: entry.id });
      batch.set(entry, logEntry({ newCount: count + 999 }));
    }),
  );
  await denied(
    commitBatch((batch) => {
      const entry = doc(collection(eventRef(), 'log'));
      batch.update(eventRef(), {
        count: count + 1,
        ticketsSold: 99,
        lastLogId: entry.id,
      });
      batch.set(entry, logEntry({ newCount: count + 1 }));
    }),
  );
  await denied(
    commitBatch((batch) => {
      const entry = doc(collection(eventRef(), 'log'));
      batch.update(eventRef(), {
        count: count + 1,
        maxCount: 1,
        lastLogId: entry.id,
      });
      batch.set(entry, logEntry({ newCount: count + 1 }));
    }),
  );
});

test('everything else is closed to browsers', async () => {
  await denied(
    addDoc(
      collection(db, 'teams/t/events/missing/log'),
      logEntry({ newCount: 1 }),
    ),
  );
  await denied(setDoc(doc(db, 'teams/new'), { name: 'x' }));
  await denied(
    setDoc(doc(db, 'teams/t/events/new'), {
      name: 'x',
      count: 0,
      ticketsSold: 0,
    }),
  );
  await denied(deleteDoc(doc(db, `${EVENT}/log/old`)));
  await denied(getDoc(doc(db, `${EVENT}/private/pin`)));
  await denied(getDoc(doc(db, 'rateLimits/x')));
  await denied(setDoc(doc(db, 'tasks/x'), { x: 1 }));
  await denied(getDoc(doc(db, 'users/x')));
});
