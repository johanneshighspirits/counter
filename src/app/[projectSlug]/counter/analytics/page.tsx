import { getOccupancyByMinute, getProject } from '@/lib/firebase-server';
import { OccupancyChart } from './_components/OccupancyChart';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ChartsPage(
  props: PageProps<'/[projectSlug]/counter/analytics'>,
) {
  const { projectSlug } = await props.params;

  const project = await getProject(projectSlug);
  if (!project) {
    notFound();
  }

  const data = await getOccupancyByMinute(projectSlug);

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="py-4 flex flex-col items-center gap-8">
        <h1>{project.name}</h1>
        <OccupancyChart data={data} />
      </div>
      <div className="flex flex-col gap-4 px-8">
        <div className="flex gap-4 items-center">
          <div className="bg-green-700 text-white text-center text-4xl font-mono grid place-items-center rounded-full aspect-square size-20">
            {project.ticketsSold}
          </div>
          <span>Sålda biljetter</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-white text-green-800 text-center text-4xl font-mono grid place-items-center rounded-full aspect-square size-20">
            {data.at(-1)?.people_inside || 0}
          </div>
          <span>Nuvarande antal</span>
        </div>
      </div>
      <Link
        className="text-center underline underline-offset-2 text-slate-400"
        href={`/${projectSlug}/counter`}>
        &laquo; Back to counter
      </Link>
    </div>
  );
}
