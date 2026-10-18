import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShareEventButton } from '@/components/ShareEventButton';
import { formatEventDate } from '@/lib/event-date';
import { getEvent, getTeam } from '@/lib/firebase-server';

const pages = [
  { path: 'counter', label: 'Räknare' },
  { path: 'tickets', label: 'Biljetter' },
  { path: 'stats', label: 'Statistik' },
];

export default async function EventHome(
  props: PageProps<'/[teamSlug]/[eventSlug]'>,
) {
  const { teamSlug, eventSlug } = await props.params;
  // Initial counter data is fetched in the event layout
  const [team, event] = await Promise.all([
    getTeam(teamSlug),
    getEvent(teamSlug, eventSlug),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="w-full max-w-sm px-4 flex flex-col gap-8 m-auto text-center">
      <header>
        <Link
          href={`/${teamSlug}`}
          className="text-slate-400 hover:underline underline-offset-2">
          {team?.name ?? teamSlug}
        </Link>
        <h1 className="font-brand text-4xl">{event.name}</h1>
        <p className="text-slate-400">{formatEventDate(event.date)}</p>
      </header>
      <nav className="flex flex-col gap-4">
        {pages.map((page) => (
          <Link
            key={page.path}
            href={`/${teamSlug}/${eventSlug}/${page.path}`}
            className="border border-white p-4 rounded-lg text-xl hover:bg-white hover:text-black transition-colors">
            {page.label}
          </Link>
        ))}
      </nav>
      <div className="flex justify-center gap-6">
        <ShareEventButton
          path={`/${teamSlug}/${eventSlug}`}
          eventName={event.name}
        />
        <Link
          href={`/${teamSlug}/${eventSlug}/admin`}
          className="text-slate-400 underline underline-offset-2">
          Admin
        </Link>
      </div>
    </div>
  );
}
