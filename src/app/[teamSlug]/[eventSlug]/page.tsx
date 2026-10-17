import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEvent, getTeam } from '@/lib/firebase-server';

const pages = [
  { path: 'counter', label: 'Räknare' },
  { path: 'tickets', label: 'Biljetter' },
  { path: 'stats', label: 'Statistik' },
];

export async function generateMetadata(
  props: PageProps<'/[teamSlug]/[eventSlug]'>,
): Promise<Metadata> {
  const { teamSlug, eventSlug } = await props.params;
  const event = await getEvent(teamSlug, eventSlug);

  return event ? { title: event.name } : {};
}

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
      <Link
        href={`/${teamSlug}/${eventSlug}/admin`}
        className="text-slate-400 underline underline-offset-2">
        Admin
      </Link>
    </div>
  );
}
