import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminLogin } from '@/components/AdminLogin';
import { BajenLogo } from '@/components/BajenLogo';
import { ResetButton } from '@/components/ResetButton';
import { isGlobalAdmin } from '@/lib/admin-auth';
import { getEventPinStatus, type PinStatus } from '@/lib/event-pin';
import { formatEventDate } from '@/lib/event-date';
import { getTeamsWithEvents } from '@/lib/firebase-server';
import { ChangePinButton } from './_components/ChangePinButton';

const pinStatusLabel: Record<PinStatus, { text: string; className: string }> =
  {
    none: { text: 'No PIN', className: 'text-amber-300' },
    set: { text: 'PIN set', className: 'text-slate-400' },
    locked: { text: 'PIN locked', className: 'text-red-400' },
  };

export const metadata: Metadata = {
  title: 'Admin',
};

export default async function GlobalAdminPage() {
  // Only ADMIN_PASSWORD unlocks this page, event PINs don't
  if (!(await isGlobalAdmin())) {
    return (
      <main className="bg-linear-to-tr from-black to-green-950">
        <AdminLogin basePath="" placeholder="Enter admin password" />
      </main>
    );
  }

  const teams = await getTeamsWithEvents();
  const eventCount = teams.reduce((sum, team) => sum + team.events.length, 0);
  const eventsLabel = `${eventCount} event${eventCount === 1 ? '' : 's'}`;

  const pinStatuses = new Map(
    await Promise.all(
      teams.flatMap((team) =>
        team.events.map(
          async (event) =>
            [
              `${team.slug}/${event.slug}`,
              await getEventPinStatus(team.slug, event.slug),
            ] as const,
        ),
      ),
    ),
  );

  return (
    <main className="min-h-dvh bg-linear-to-tr from-black to-green-950">
      <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        <header className="flex items-baseline justify-between gap-4">
          <h1 className="font-brand text-4xl">Admin</h1>
          <Link
            href="/"
            className="text-slate-400 underline underline-offset-2">
            + Nytt evenemang
          </Link>
        </header>

        {teams.length === 0 && <p className="text-slate-400">No teams yet</p>}

        {teams.map((team) => (
          <section key={team.slug} className="flex flex-col gap-3">
            <h2 className="text-xl">
              <Link href={`/${team.slug}`} className="hover:underline">
                {team.name}
              </Link>{' '}
              <span className="text-slate-500 font-mono text-sm">
                /{team.slug}
              </span>
            </h2>

            {team.events.length === 0 && (
              <p className="text-slate-400 text-sm">No events</p>
            )}

            <ul className="flex flex-col divide-y divide-white/10 border border-white/20 rounded-lg">
              {team.events.map((event) => {
                const basePath = `/${team.slug}/${event.slug}`;
                const pinStatus =
                  pinStatusLabel[
                    pinStatuses.get(`${team.slug}/${event.slug}`) ?? 'none'
                  ];
                return (
                  <li
                    key={event.slug}
                    className="flex items-center gap-4 p-3 flex-wrap">
                    <div className="flex-1 min-w-40">
                      <Link href={basePath} className="hover:underline">
                        {event.name}
                      </Link>{' '}
                      <span className="text-slate-500 text-sm">
                        {formatEventDate(event.date)}
                      </span>
                      <p className="text-slate-400 text-sm">
                        Inne{' '}
                        <span className="font-mono font-bold text-white">
                          {event.count}
                        </span>
                        {' / '}
                        {event.maxCount} · Biljetter{' '}
                        <span className="font-mono font-bold text-white">
                          {event.ticketsSold}
                        </span>
                        {' · '}
                        <span className={pinStatus.className}>
                          {pinStatus.text}
                        </span>
                      </p>
                    </div>
                    <Link
                      href={`${basePath}/admin`}
                      className="text-slate-400 underline underline-offset-2 text-sm">
                      Settings
                    </Link>
                    <ChangePinButton basePath={basePath} />
                    <ResetButton
                      url={`${basePath}/api/counter/reset`}
                      label="Reset"
                      className="px-4 py-2 text-sm"
                      confirmMessage={`Reset ${team.name} / ${event.name}? This sets both counters to 0 and deletes the history.`}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {eventCount > 0 && (
          <ResetButton
            url="/api/admin/reset-all"
            label={`Reset all ${eventsLabel}`}
            className="p-4 border-red-400! text-red-300 hover:bg-red-950/60! hover:text-red-200!"
            confirmMessage={`Reset ALL ${eventsLabel} in every team? This sets every counter to 0 and deletes all history.`}
          />
        )}

        <BajenLogo className="h-12 mt-8" />
      </div>
    </main>
  );
}
