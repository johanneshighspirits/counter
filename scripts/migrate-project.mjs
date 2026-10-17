// Copy an old projects/{slug} document, with its log and PIN, to
// teams/{teamSlug}/events/{eventSlug}. The old document is left untouched,
// so delete it yourself once the new version is live.
// Usage: node --env-file=.env.local scripts/migrate-project.mjs <projectSlug> <teamSlug> "<team name>" <eventSlug> "<event name>"

import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const [projectSlug, teamSlug, teamName, eventSlug, eventName] =
  process.argv.slice(2);

if (!projectSlug || !teamSlug || !teamName || !eventSlug || !eventName) {
  console.error(
    'Usage: node --env-file=.env.local scripts/migrate-project.mjs <projectSlug> <teamSlug> "<team name>" <eventSlug> "<event name>"',
  );
  process.exit(1);
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
initializeApp(
  serviceAccountKey
    ? { credential: cert(JSON.parse(serviceAccountKey)) }
    : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
);

const db = getFirestore();
const projectRef = db.collection('projects').doc(projectSlug);
const project = await projectRef.get();

if (!project.exists) {
  console.error(`Project "${projectSlug}" not found`);
  process.exit(1);
}

const teamRef = db.collection('teams').doc(teamSlug);
const eventRef = teamRef.collection('events').doc(eventSlug);

if ((await eventRef.get()).exists) {
  console.error(`Event "${teamSlug}/${eventSlug}" already exists`);
  process.exit(1);
}

await teamRef.set({ name: teamName }, { merge: true });
await eventRef.set({
  ...project.data(),
  name: eventName,
  createdAt: FieldValue.serverTimestamp(),
});

// Firestore batches hold at most 500 writes
const log = await projectRef.collection('log').get();
for (let i = 0; i < log.docs.length; i += 500) {
  const batch = db.batch();
  for (const entry of log.docs.slice(i, i + 500)) {
    batch.set(eventRef.collection('log').doc(entry.id), entry.data());
  }
  await batch.commit();
}

const secret = await db.collection('projectSecrets').doc(projectSlug).get();
if (secret.exists) {
  await eventRef.collection('private').doc('pin').set(secret.data());
}

console.log(
  `Copied "${projectSlug}" to "${teamSlug}/${eventSlug}" (${log.size} log entries${secret.exists ? ', PIN' : ''})`,
);
