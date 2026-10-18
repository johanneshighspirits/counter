import { BajenLogo } from '@/components/BajenLogo';
import { BottomNav } from '@/components/BottomNav';
import { CounterProvider } from '@/components/CounterProvider';
import { getEvent, getEventTitle } from '@/lib/firebase-server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';

// Pages add their own part in front, e.g. "Statistik · Julmarknad · Team 16"
export async function generateMetadata(
  props: LayoutProps<'/[teamSlug]/[eventSlug]'>,
): Promise<Metadata> {
  const { teamSlug, eventSlug } = await props.params;
  const title = await getEventTitle(teamSlug, eventSlug);
  return { title: { default: title, template: `%s · ${title}` } };
}

export default async function EventLayout({
  params,
  children,
}: PropsWithChildren<{
  params: Promise<{ teamSlug: string; eventSlug: string }>;
}>) {
  const { teamSlug, eventSlug } = await params;
  // Fetch initial count and config
  const event = await getEvent(teamSlug, eventSlug);

  if (!event) {
    notFound();
  }

  return (
    <CounterProvider
      teamSlug={event.teamSlug}
      eventSlug={event.slug}
      initialCount={event.count}
      initialMaxCount={event.maxCount}
      initialTicketsSold={event.ticketsSold}>
      <main className="flex flex-col items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
        {children}
        <BajenLogo className="h-12 mt-auto mb-3" />
        <p className="text-gray-600 text-sm mb-8">
          Enheter är synkade i realtid
        </p>
        <BottomNav basePath={`/${event.teamSlug}/${event.slug}`} />
      </main>
    </CounterProvider>
  );
}
