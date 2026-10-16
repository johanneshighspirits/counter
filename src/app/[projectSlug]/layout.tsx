import { CounterProvider } from '@/components/CounterProvider';
import { getProject } from '@/lib/firebase-server';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';

export default async function ProjectLayout({
  params,
  children,
}: PropsWithChildren<{ params: Promise<{ projectSlug: string }> }>) {
  const { projectSlug } = await params;
  // Fetch initial count and config
  const project = await getProject(projectSlug);

  if (!project) {
    notFound();
  }

  return (
    <CounterProvider
      projectSlug={project.slug}
      initialCount={project.count}
      initialMaxCount={project.maxCount}
      initialTicketsSold={project.ticketsSold}>
      <main className="flex flex-col items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
        {children}
        <p className="text-gray-600 text-sm mb-8 mt-auto">
          Enheter är synkade i realtid
        </p>
      </main>
    </CounterProvider>
  );
}
