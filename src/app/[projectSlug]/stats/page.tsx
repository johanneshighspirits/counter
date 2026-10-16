import { getOccupancyByMinute, getProject } from '@/lib/firebase-server';
import { OccupancyChart } from './_components/OccupancyChart';
import { StatTiles } from './_components/StatTiles';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function StatsPage(
  props: PageProps<'/[projectSlug]/stats'>,
) {
  const { projectSlug } = await props.params;

  const project = await getProject(projectSlug);
  if (!project) {
    notFound();
  }

  const data = await getOccupancyByMinute(projectSlug);

  return (
    <div className="w-full max-w-2xl px-4 pt-6 pb-4 flex flex-col gap-4">
      <h1 className="text-center text-xl text-slate-400">{project.name}</h1>
      <StatTiles />
      <OccupancyChart data={data} />
      <Link
        className="text-center underline underline-offset-2 text-slate-400 py-2"
        href={`/${projectSlug}/counter`}>
        &laquo; Tillbaka till räknaren
      </Link>
    </div>
  );
}
