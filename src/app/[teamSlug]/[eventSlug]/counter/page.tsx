import { getEvent } from '@/lib/firebase-server';
import { Counter } from '@/components/Counter';
import { notFound } from 'next/navigation';

export default async function Home(props: PageProps<'/[teamSlug]/[eventSlug]/counter'>) {
  const { teamSlug, eventSlug } = await props.params;
  // Initial counter data is fetched in the event layout
  const event = await getEvent(teamSlug, eventSlug);

  if (!event) {
    notFound();
  }

  return <Counter projectName={event.name} />;
}
