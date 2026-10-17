import type { Metadata } from 'next';
import { BajenLogo } from '@/components/BajenLogo';
import { getTeam, getTeams } from '@/lib/firebase-server';
import { CreateEventForm } from './_components/CreateEventForm';

export const metadata: Metadata = {
  title: 'Nytt evenemang',
};

export default async function Home(props: PageProps<'/'>) {
  const { team } = await props.searchParams;
  // "Nytt evenemang" on a team page links here with ?team=<slug>
  const initialTeam = typeof team === 'string' ? await getTeam(team) : null;
  const teams = await getTeams();

  return (
    <main className="flex items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
      <div className="w-full max-w-sm px-4 py-8 flex flex-col gap-6">
        <h1 className="font-brand text-4xl text-center">Nytt evenemang</h1>
        <CreateEventForm
          teamNames={teams.map((t) => t.name)}
          initialTeamName={initialTeam?.name ?? ''}
        />
        <BajenLogo className="mt-10 h-24" />
      </div>
    </main>
  );
}
