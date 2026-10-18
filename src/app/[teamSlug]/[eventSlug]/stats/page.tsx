import { Suspense } from 'react';
import { getCachedEventLog, getEvent } from '@/lib/firebase-server';
import { formatEventDate } from '@/lib/event-date';
import { ChartSkeleton } from './_components/ChartSkeleton';
import { LiveOccupancyChart } from './_components/LiveOccupancyChart';
import { StatTiles } from './_components/StatTiles';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// The event layout appends " · Julmarknad · Team 16"
export const metadata: Metadata = {
  title: 'Statistik',
};

// Loads the log separately, so the header and live tiles show right away
const Charts = async ({
  teamSlug,
  eventSlug,
}: {
  teamSlug: string;
  eventSlug: string;
}) => {
  const log = await getCachedEventLog(teamSlug, eventSlug);
  return (
    <LiveOccupancyChart
      teamSlug={teamSlug}
      eventSlug={eventSlug}
      initialLog={log}
    />
  );
};

export default async function StatsPage(
  props: PageProps<'/[teamSlug]/[eventSlug]/stats'>,
) {
  const { teamSlug, eventSlug } = await props.params;

  const event = await getEvent(teamSlug, eventSlug);
  if (!event) {
    notFound();
  }

  return (
    <div className="w-full max-w-2xl px-4 pt-6 pb-4 flex flex-col gap-4">
      <h1 className="text-center text-xl text-slate-400">
        {event.name}{' '}
        <span className="text-base text-slate-500">
          · {formatEventDate(event.date)}
        </span>
      </h1>
      <StatTiles />
      <Suspense fallback={<ChartSkeleton />}>
        <Charts teamSlug={teamSlug} eventSlug={eventSlug} />
      </Suspense>
    </div>
  );
}
