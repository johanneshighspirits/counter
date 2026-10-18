import { cookies } from 'next/headers';
import Link from 'next/link';
import { BajenLogo } from '@/components/BajenLogo';
import { E2E_COOKIE_NAME, isE2eTeam } from '@/lib/e2e';
import { getTeam, getTeams } from '@/lib/firebase-server';
import { CreateEventForm } from './_components/CreateEventForm';

export default async function Home(props: PageProps<'/'>) {
  const { team } = await props.searchParams;
  // "Nytt evenemang" on a team page links here with ?team=<slug>
  const initialTeam = typeof team === 'string' ? await getTeam(team) : null;
  const showE2eTeam = (await cookies()).has(E2E_COOKIE_NAME);
  const teams = (await getTeams()).filter(
    (t) => showE2eTeam || !isE2eTeam(t.slug),
  );

  return (
    <main className="flex items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
      <div className="w-full max-w-md px-4 py-8 flex flex-col gap-10">
        {teams.length > 0 && (
          <section className="flex flex-col gap-4">
            <h1 className="font-brand text-4xl text-center">Lag</h1>
            {/* Compact, so the form below stays in view */}
            <nav className="flex flex-wrap justify-center gap-2">
              {teams.map((t) => (
                <Link
                  key={t.slug}
                  href={`/${t.slug}`}
                  className="bg-[#0f1a14] border border-white/20 px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-colors">
                  {t.name}
                </Link>
              ))}
            </nav>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="font-brand text-4xl text-center">Nytt evenemang</h2>
          <CreateEventForm
            teamNames={teams.map((t) => t.name)}
            initialTeamName={initialTeam?.name ?? ''}
          />
        </section>
        <BajenLogo className="mt-4 h-24" />
      </div>
    </main>
  );
}
