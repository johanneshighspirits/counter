import type { Metadata } from 'next';
import { getEvent, getEventTitle } from '@/lib/firebase-server';
import { TicketCounter } from '@/components/TicketCounter';
import { notFound } from 'next/navigation';

// Initial title from the server; TicketCounter keeps it updated afterwards
export async function generateMetadata(
  props: PageProps<'/[teamSlug]/[eventSlug]/tickets'>,
): Promise<Metadata> {
  const { teamSlug, eventSlug } = await props.params;
  const event = await getEvent(teamSlug, eventSlug);

  // The event layout appends " · Julmarknad · Team 16"
  return event ? { title: `(${event.ticketsSold}) Biljetter` } : {};
}

export default async function TicketsPage(
  props: PageProps<'/[teamSlug]/[eventSlug]/tickets'>,
) {
  const { teamSlug, eventSlug } = await props.params;
  // Initial counter data is fetched in the event layout
  const [event, eventTitle] = await Promise.all([
    getEvent(teamSlug, eventSlug),
    getEventTitle(teamSlug, eventSlug),
  ]);

  if (!event) {
    notFound();
  }

  return <TicketCounter eventTitle={eventTitle} />;
}
