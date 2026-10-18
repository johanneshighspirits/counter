// Create (or rename) a team and an event in Firestore. The event gets no PIN,
// so only ADMIN_PASSWORD unlocks its admin page.
// Usage: node --env-file=.env.local scripts/create-event.mjs <teamSlug> "<team name>" <eventSlug> "<event name>" [maxCount]

import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const [teamSlug, teamName, eventSlug, eventName, maxCount = '150'] =
  process.argv.slice(2);

if (!teamSlug || !teamName || !eventSlug || !eventName) {
  console.error(
    'Usage: node --env-file=.env.local scripts/create-event.mjs <teamSlug> "<team name>" <eventSlug> "<event name>" [maxCount]',
  );
  process.exit(1);
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
initializeApp(
  serviceAccountKey
    ? { credential: cert(JSON.parse(serviceAccountKey)) }
    : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
);

const teamRef = getFirestore().collection('teams').doc(teamSlug);
await teamRef.set({ name: teamName }, { merge: true });

const eventRef = teamRef.collection('events').doc(eventSlug);
const existing = await eventRef.get();

if (existing.exists) {
  await eventRef.update({ name: eventName });
  console.log(`Renamed event "${teamSlug}/${eventSlug}" to "${eventName}"`);
} else {
  await eventRef.set({
    name: eventName,
    count: 0,
    maxCount: Number(maxCount),
    ticketsSold: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log(`Created event "${teamSlug}/${eventSlug}"`);
}
