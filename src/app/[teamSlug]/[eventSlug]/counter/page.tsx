import type { Metadata } from 'next';
import { getEvent, getEventTitle } from '@/lib/firebase-server';
import { Counter } from '@/components/Counter';
import { notFound } from 'next/navigation';

// Initial title from the server; Counter keeps it updated afterwards
export async function generateMetadata(
  props: PageProps<'/[teamSlug]/[eventSlug]/counter'>,
): Promise<Metadata> {
  const { teamSlug, eventSlug } = await props.params;
  const [event, eventTitle] = await Promise.all([
    getEvent(teamSlug, eventSlug),
    getEventTitle(teamSlug, eventSlug),
  ]);

  return event ? { title: { absolute: `(${event.count}) ${eventTitle}` } } : {};
}

export default async function Home(props: PageProps<'/[teamSlug]/[eventSlug]/counter'>) {
  const { teamSlug, eventSlug } = await props.params;
  // Initial counter data is fetched in the event layout
  const [event, eventTitle] = await Promise.all([
    getEvent(teamSlug, eventSlug),
    getEventTitle(teamSlug, eventSlug),
  ]);

  if (!event) {
    notFound();
  }

  return <Counter eventTitle={eventTitle} />;
}
