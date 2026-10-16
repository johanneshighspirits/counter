import { CounterProvider } from '@/components/CounterProvider';
import { getProjectScopedServerClient } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { PropsWithChildren } from 'react';

export default async function ProjectLayout({
  params,
  children,
}: PropsWithChildren<{ params: Promise<{ projectSlug: string }> }>) {
  const { projectSlug } = await params;
  const { supabase, project } = await getProjectScopedServerClient(projectSlug);
  // Fetch initial count and config
  const { data, error: fetchError } = await supabase
    .from('event_counter')
    .select('count, max_count, tickets_sold')
    .eq('id', project.id)
    .single();

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    notFound();
  }

  if (!data) {
    console.error('No data');
    redirect('/');
  }

  return (
    <CounterProvider
      projectId={project.id}
      projectName={project.name}
      initialCount={data.count}
      initialMaxCount={data.max_count}
      initialTicketsSold={data.tickets_sold}>
      <main className="flex flex-col items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
        {children}
        <p className="text-gray-600 text-sm mb-8 mt-auto">
          Enheter är synkade i realtid
        </p>
      </main>
    </CounterProvider>
  );
}
