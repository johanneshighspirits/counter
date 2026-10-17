import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BajenLogo } from '@/components/BajenLogo';
import { getTeam, getTeamEvents } from '@/lib/firebase-server';

export async function generateMetadata(
  props: PageProps<'/[teamSlug]'>,
): Promise<Metadata> {
  const { teamSlug } = await props.params;
  const team = await getTeam(teamSlug);

  return team ? { title: team.name } : {};
}

export default async function TeamPage(props: PageProps<'/[teamSlug]'>) {
  const { teamSlug } = await props.params;
  const team = await getTeam(teamSlug);

  if (!team) {
    notFound();
  }

  const events = await getTeamEvents(teamSlug);

  return (
    <main className="flex flex-col items-center min-h-dvh bg-linear-to-tr from-black to-green-950">
      <div className="w-full max-w-sm px-4 flex flex-col gap-8 m-auto py-8 text-center">
        <h1 className="font-brand text-4xl">{team.name}</h1>
        <nav className="flex flex-col gap-4">
          {events.length === 0 && (
            <p className="text-slate-400">Inga evenemang än</p>
          )}
          {events.map((event) => (
            <Link
              key={event.slug}
              href={`/${teamSlug}/${event.slug}`}
              className="border border-white p-4 rounded-lg text-xl hover:bg-white hover:text-black transition-colors">
              {event.name}
            </Link>
          ))}
        </nav>
        <Link
          href={`/?team=${teamSlug}`}
          className="text-slate-400 underline underline-offset-2">
          + Nytt evenemang
        </Link>
      </div>
      <BajenLogo className="h-12 mb-8" />
    </main>
  );
}
