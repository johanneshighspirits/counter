# Event Visitor Counter

A real-time visitor counter web application built with **Next.js 16.1.2**, **TailwindCSS**, and **Supabase**. The counter syncs across multiple devices instantly using Supabase's real-time subscriptions.

## Features

- ✅ Real-time counter updates across all connected devices
- ✅ Increment/decrement visitor count with buttons
- ✅ Prevents count from going below 0
- ✅ Responsive design with TailwindCSS
- ✅ Clean, modern UI with large, easy-to-read counter display
- ✅ Real-time Supabase subscriptions using WebSockets
- ✅ Built with Next.js App Router
- ✅ TypeScript support

## Prerequisites

- Node.js 22+
- npm/yarn/pnpm
- A Supabase account (free tier works great)

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/log in
2. Create a new project
3. Note your project **URL** and **Anon Key** (from Settings > API)

### 2. Create Database Table

In your Supabase project, go to **SQL Editor** and run the contents of `./init-db.sql`

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace:

- `your_supabase_project_url` with your Supabase project URL
- `your_supabase_publishable_key` with your Supabase publishable key

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
│   │   ├── page.tsx          # Main counter component
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles with Tailwind
│   └── lib/
│       └── supabase.ts       # Supabase client initialization
├── .env.local               # Environment variables (not in git)
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## How It Works

### Real-time Subscriptions

The app uses Supabase's `postgres_changes` feature to listen for changes to the `event_counter` table:

- When you increment/decrement the counter, the database updates
- All connected clients receive the update via WebSocket
- The counter value updates instantly across all devices

### Atomic Updates

The counter updates are handled client-side:

- Client reads current count
- Client calculates new value (old value ± 1)
- Client sends update to Supabase
- Database and all subscribers get updated instantly

### Features

- **Increment Button**: Increases the count by 1
- **Decrement Button**: Decreases the count by 1 (disabled if count = 0)
- **Real-time Sync**: Changes visible immediately on all devices
- **Error Handling**: Shows error messages if updates fail
- **Loading State**: Shows loading indicator while fetching initial count

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
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anonymous key (public, safe to expose) |

## Troubleshooting

### Counter not syncing across devices?

1. Check that Realtime is enabled for the `event_counter` table in Supabase
2. Verify environment variables are correct
3. Check browser console for errors
4. Make sure WebSocket connections are not blocked by firewall

### "Invalid supabaseUrl" error?

- Ensure `NEXT_PUBLIC_SUPABASE_URL` is set in `.env.local`
- Check that the URL format is correct (should start with `https://`)

### Updates not saving?

1. Check that the database table exists
2. Verify you have permission to insert/update in the table
3. Check that `row_security` policies aren't blocking updates

## Technologies Used

- **Next.js 16.1.2** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Supabase** - Open-source Firebase alternative
- **@supabase/supabase-js** - Supabase client library

## License

MIT - Feel free to use this project for anything!

## Next Steps

- Add authentication to track individual visitors
- Add timestamp tracking for visitor history
- Create analytics dashboard
- Add visitor limit notifications
- Integrate with calendar for event scheduling
