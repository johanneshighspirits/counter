import { BajenLogo } from '@/components/BajenLogo';
import { BottomNav } from '@/components/BottomNav';
import { CounterProvider } from '@/components/CounterProvider';
import { getEvent } from '@/lib/firebase-server';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';

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
