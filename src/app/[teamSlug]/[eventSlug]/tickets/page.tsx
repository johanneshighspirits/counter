import type { Metadata } from 'next';
import { getEvent } from '@/lib/firebase-server';
import { TicketCounter } from '@/components/TicketCounter';
import { notFound } from 'next/navigation';

// Initial title from the server; TicketCounter keeps it updated afterwards
export async function generateMetadata(
  props: PageProps<'/[teamSlug]/[eventSlug]/tickets'>,
): Promise<Metadata> {
  const { teamSlug, eventSlug } = await props.params;
  const event = await getEvent(teamSlug, eventSlug);

  return event
    ? { title: `(${event.ticketsSold}) Biljetter · ${event.name}` }
    : {};
}

export default async function TicketsPage(
  props: PageProps<'/[teamSlug]/[eventSlug]/tickets'>,
) {
  const { teamSlug, eventSlug } = await props.params;
  // Initial counter data is fetched in the event layout
  const event = await getEvent(teamSlug, eventSlug);

  if (!event) {
    notFound();
  }

  return <TicketCounter projectName={event.name} />;
}
