# Event Visitor Counter

A real-time visitor counter web application built with **Next.js 16.1.2**, **TailwindCSS**, and **Firebase Cloud Firestore**. The counter syncs across multiple devices instantly using Firestore's real-time listeners. Everything fits in Firebase's free Spark plan.

## Features

- ✅ Real-time counter updates across all connected devices
- ✅ Increment/decrement visitor count with buttons
- ✅ Prevents count from going below 0
- ✅ Responsive design with TailwindCSS
- ✅ Clean, modern UI with large, easy-to-read counter display
- ✅ Real-time Firestore listeners
- ✅ Built with Next.js App Router
- ✅ TypeScript support

## Prerequisites

- Node.js 22+
- npm/yarn/pnpm
- A Firebase account (the free Spark plan is enough)
- The Firebase CLI (`npm install -g firebase-tools`)

## Setup Instructions

### 1. Create Firebase Project

1. Go to the [Firebase console](https://console.firebase.google.com) and create a project
2. Under **Build > Firestore Database**, create a database in production mode
3. Under **Project settings > General**, add a **Web app** and note its config values
4. Under **Project settings > Service accounts**, generate a new private key (a JSON file)

### 2. Deploy Security Rules

```bash
firebase use --add            # pick the project you created
firebase deploy --only firestore:rules
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_web_app_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_APP_ID=your_web_app_id
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
ADMIN_PASSWORD=your_admin_password
```

`FIREBASE_SERVICE_ACCOUNT_KEY` is the whole service account JSON file on one line.

### 4. Create an Event

Open the start page (`/`), enter the team, the event name, the date (today by default, editable later on the event's admin page) and an admin PIN, and you get a link like `/team17/skridskodisco`. Teams are created on the fly: the team slug is the name with only letters and digits (`Team 17` → `team17`), so the same team is found however it's typed.

Events can also be created from the command line (these have no PIN, so only `ADMIN_PASSWORD` unlocks their admin page):

```bash
node --env-file=.env.local scripts/create-event.mjs team17 "Team 17" skridskodisco "Skridskodisco"
```

Optional extra arguments are the max count (default 150) and the date as `YYYY-MM-DD` (default today).

To set or change an event's admin PIN (this also clears a lockout):

```bash
node --env-file=.env.local scripts/set-pin.mjs team17 skridskodisco 2017
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Deploy to Production

```bash
npm run build
npm start
```

For deployment to Vercel or other platforms:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in the deployment platform
4. Deploy!

## Project Structure

```bash
counter/
├── src/
│   ├── app/
│   │   ├── [teamSlug]/
│   │   │   ├── page.tsx      # Team page listing its events
│   │   │   └── [eventSlug]/
│   │   │       ├── layout.tsx  # Loads the event and provides counter state
│   │   │   ├── counter/      # Door counter
│   │   │   ├── stats/        # Occupancy chart and totals
│   │   │   ├── tickets/      # Ticket sales
│   │   │   ├── admin/        # Reset and max count
│   │   │   └── api/          # Admin API routes
│   │   └── layout.tsx        # Root layout
│   ├── components/           # Counter UI and CounterProvider
│   └── lib/
│       ├── firebase.ts         # Browser Firestore client and counter updates
│       └── firebase-server.ts  # firebase-admin for server code
├── scripts/create-event.mjs    # Create a team and event
├── scripts/set-pin.mjs        # Set an event's admin PIN
├── firestore.rules             # Firestore security rules
└── firebase.json               # Firebase CLI config
```

## How It Works

### Data Model

- `teams/{team}`: `name`
- `teams/{team}/events/{event}`: `name`, `count` (people inside), `maxCount`, `ticketsSold` and `createdAt`
- `teams/{team}/events/{event}/private/pin`: `pinHash` (scrypt, `salt:hash`), `failedAttempts`, `lockedUntil`. Browsers can't read it; the event itself is readable by everyone
- `teams/{team}/events/{event}/log/{id}`: one entry per change, with `type` (`occupancy` or `tickets`), `delta`, `newCount`, `source` and `createdAt`

### Real-time Sync

Every device listens to its event document with `onSnapshot`, so a change from one device shows up on all of them right away.

### Updates and Offline Clicks

The + / − and ticket buttons write one batch: `increment()` on the counter and a new log entry with the change. The server applies the increment to the stored value, so simultaneous clicks from several devices all count.

The batch doesn't need a connection. Firestore applies it to the local cache (kept in IndexedDB) at once, so the number changes right away, and sends it when the device is online again, also after a reload. While clicks wait, the event pages show a notice. A click sent late gets the time it reached the server, so it shows up then in the stats.

The security rules only let browsers change `count` and `ticketsSold` together with a log entry whose `delta` is exactly the change, and never below 0. The stats work back from the current totals through the log's deltas. Creating teams and events, changing the max count and resetting go through `firebase-admin` on the server.

### Pages

- **`/`**: create a new event with a name and an admin PIN
- **`/admin`**: every team and event with live counts, and resetting one or all events. `ADMIN_PASSWORD` only
- **`/[team]`**: the team's events, newest first
- **`/[team]/[event]`**: event home page with links to the counter, tickets and stats
- **`/[team]/[event]/counter`**: door counter with +/− buttons for occupancy
- **`/[team]/[event]/stats`**: entries, exits and people inside per minute for the last 6 hours
- **`/[team]/[event]/tickets`**: ticket sales, with buttons for selling 1–4 tickets at a time
- **`/[team]/[event]/admin`**: reset the counters and set the max count. Unlocked with the event's PIN or with `ADMIN_PASSWORD`

## Styling

The app uses TailwindCSS with a beautiful gradient background and responsive design:

- **Counter Display**: Large, centered text (text-8xl on desktop, text-9xl on mobile)
- **Buttons**: Green for increment, red for decrement
- **Responsive**: Works on mobile, tablet, and desktop
- **Hover Effects**: Buttons have smooth hover and active states
- **Shadow Effects**: Cards and buttons have subtle shadows

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web app API key (public, safe to expose) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app ID |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON for `firebase-admin` (secret) |
| `ADMIN_PASSWORD` | Master password for every event's admin page |
| `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST` | Optional, e.g. `127.0.0.1:8080`, to use the local emulator from the browser |
| `FIRESTORE_EMULATOR_HOST` | Optional, the same for server code |

## Local Development with the Emulator

The Firestore emulator needs Java 21 or newer.

```bash
firebase emulators:start --only firestore --project demo-counter
```

Then run the app against it:

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-counter \
NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_SERVICE_ACCOUNT_KEY= \
npm run dev
```

## Tests

### Security rules

```bash
npm run test:rules
```

Runs `rules-tests/` against `firestore.rules` in the emulator (Java 21 or newer), including clicks that overlap on two devices. Run it before deploying the rules.

### End to end

```bash
npx playwright install chromium   # once
npm run test:e2e                  # against the local dev server
npm run test:e2e:prod             # against production, once it passes locally
```

Walks through one event's life in a phone-sized browser: creating it, counting, tickets, stats, admin settings, PIN lockout and deleting it. `npm run test:e2e` starts the dev server unless it's already running; set `E2E_BASE_URL` to test another deployment.

The dev server uses the production database too, so both create and delete a real event. They do it in the e2e team, "JayBo Test Team" (`src/lib/e2e.ts`), which visitors never see: the start page only lists it for browsers with the `e2e` cookie, which the tests set, and it doesn't count toward the 20-team cap.

To try changes to `firestore.rules` before deploying them, run the dev server against the emulator (see above, e.g. with `-p 3001`) and the tests with the same `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST` plus `E2E_BASE_URL=http://localhost:3001`.

Against production, each run creates two events and makes six login attempts, which counts toward the rate limits (5 new events and 10 logins per 10 minutes per IP), so leave about 10 minutes between runs.

## Troubleshooting

### Counter not syncing across devices?

1. Check that the security rules are deployed (`firebase deploy --only firestore:rules`)
2. Verify environment variables are correct
3. Check browser console for errors
4. Make sure WebSocket and long-polling connections to `firestore.googleapis.com` are not blocked by a firewall

### "Missing Firebase environment variables" error?

- Ensure the `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`

### Updates not saving?

1. Check that the event document exists (see "Create an Event")
2. Look for `permission-denied` errors in the browser console, which mean the security rules rejected the write

## Technologies Used

- **Next.js 16.1.2** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Cloud Firestore** - Real-time document database
- **firebase** / **firebase-admin** - Firebase client and server SDKs

## License

MIT - Feel free to use this project for anything!

## Next Steps

- Add authentication to track individual visitors
- Add timestamp tracking for visitor history
- Create analytics dashboard
- Add visitor limit notifications
- Integrate with calendar for event scheduling
