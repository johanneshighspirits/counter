import { getOccupancyByMinute, getEvent } from '@/lib/firebase-server';
import { OccupancyChart } from './_components/OccupancyChart';
import { StatTiles } from './_components/StatTiles';
import { notFound } from 'next/navigation';

export default async function StatsPage(
  props: PageProps<'/[teamSlug]/[eventSlug]/stats'>,
) {
  const { teamSlug, eventSlug } = await props.params;

  const event = await getEvent(teamSlug, eventSlug);
  if (!event) {
    notFound();
  }

  const data = await getOccupancyByMinute(teamSlug, eventSlug);

  return (
    <div className="w-full max-w-2xl px-4 pt-6 pb-4 flex flex-col gap-4">
      <h1 className="text-center text-xl text-slate-400">{event.name}</h1>
      <StatTiles />
      <OccupancyChart data={data} />
    </div>
  );
}
