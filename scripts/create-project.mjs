// Create (or rename) a project document in Firestore.
// Usage: node --env-file=.env.local scripts/create-project.mjs <slug> "<name>" [maxCount]

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [slug, name, maxCount = '300'] = process.argv.slice(2);

if (!slug || !name) {
  console.error(
    'Usage: node --env-file=.env.local scripts/create-project.mjs <slug> "<name>" [maxCount]',
  );
  process.exit(1);
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
initializeApp(
  serviceAccountKey
    ? { credential: cert(JSON.parse(serviceAccountKey)) }
    : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
);

const projectRef = getFirestore().collection('projects').doc(slug);
const existing = await projectRef.get();

if (existing.exists) {
  await projectRef.update({ name });
  console.log(`Renamed project "${slug}" to "${name}"`);
} else {
  await projectRef.set({
    name,
    count: 0,
    maxCount: Number(maxCount),
    ticketsSold: 0,
  });
  console.log(`Created project "${slug}"`);
}
