import { getProjectScopedServerClient } from '@/lib/supabase-server';
import {
  OccupancyDataPoint,
  OccupancyChart,
} from './_components/OccupancyChart';
import Link from 'next/link';

export default async function ChartsPage(
  props: PageProps<'/[projectSlug]/counter/analytics'>,
) {
  const { projectSlug } = await props.params;

  const { supabase, project } = await getProjectScopedServerClient(projectSlug);
  const { data } = await supabase.rpc('get_occupancy_by_minute');

  return (
    <div className="p-4 flex flex-col items-center gap-8">
      <h1>{project.name}</h1>
      <OccupancyChart data={data as OccupancyDataPoint[]} />
      <div className="bg-green-700 text-white text-center text-4xl font-mono grid place-items-center rounded-full aspect-square size-20 mt-8 mx-auto">
        {data.at(-1)?.people_inside || 0}
      </div>
      <Link href={`/${projectSlug}/counter`}>&laquo; Räknare</Link>
    </div>
  );
}
