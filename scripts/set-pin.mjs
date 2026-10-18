// Set (or change) the admin PIN of an event. Also clears any lockout.
// Usage: node --env-file=.env.local scripts/set-pin.mjs <teamSlug> <eventSlug> <pin>

import { randomBytes, scryptSync } from 'node:crypto';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [teamSlug, eventSlug, pin] = process.argv.slice(2);

if (!teamSlug || !eventSlug || !pin) {
  console.error(
    'Usage: node --env-file=.env.local scripts/set-pin.mjs <teamSlug> <eventSlug> <pin>',
  );
  process.exit(1);
}

// Same rule and hash format ("salt:hash", scrypt) as src/lib/event-pin.ts
if (!/^\d{4,8}$/.test(pin)) {
  console.error('The PIN must be 4–8 digits');
  process.exit(1);
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
initializeApp(
  serviceAccountKey
    ? { credential: cert(JSON.parse(serviceAccountKey)) }
    : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
);

const eventRef = getFirestore()
  .collection('teams')
  .doc(teamSlug)
  .collection('events')
  .doc(eventSlug);

if (!(await eventRef.get()).exists) {
  console.error(`Event "${teamSlug}/${eventSlug}" not found`);
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(pin, salt, 32).toString('hex');

await eventRef
  .collection('private')
  .doc('pin')
  .set({ pinHash: `${salt}:${hash}`, failedAttempts: 0 });

console.log(`Set the PIN for "${teamSlug}/${eventSlug}"`);
