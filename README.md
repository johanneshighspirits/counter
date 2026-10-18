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

Open the start page (`/`), enter the team, the event name and an admin PIN, and you get a link like `/team17/skridskodisco`. Teams are created on the fly: the team slug is the name with only letters and digits (`Team 17` → `team17`), so the same team is found however it's typed.

Events can also be created from the command line (these have no PIN, so only `ADMIN_PASSWORD` unlocks their admin page):

```bash
node --env-file=.env.local scripts/create-event.mjs team17 "Team 17" skridskodisco "Skridskodisco"
```

To set or change an event's admin PIN (this also clears a lockout):

```bash
node --env-file=.env.local scripts/set-pin.mjs team17 skridskodisco 2017
```

To move an event from the old single-level `projects/{slug}` model, with its log and PIN:

```bash
node --env-file=.env.local scripts/migrate-project.mjs team17 team17 "Team 17" skridskodisco "Skridskodisco"
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
├── scripts/migrate-project.mjs # Move an old projects/{slug} to a team event
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

### Atomic Updates

The + / − and ticket buttons run a Firestore transaction that reads the current value, applies the change (clamped at 0), and writes the new value together with a log entry. Simultaneous clicks from several devices are retried by Firestore instead of overwriting each other.

The security rules only let browsers change `count` and `ticketsSold` and add log entries. Creating teams and events, changing the max count and resetting go through `firebase-admin` on the server.

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
