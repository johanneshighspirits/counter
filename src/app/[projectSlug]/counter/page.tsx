import { getProjectScopedServerClient } from '@/lib/supabase-server';
import { Counter } from './_components/Counter';
import { notFound, redirect } from 'next/navigation';

export default async function Home(props: PageProps<'/[projectSlug]/counter'>) {
  const { projectSlug } = await props.params;
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
    <main className="flex items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
      <Counter
        projectId={project.id}
        projectName={project.name}
        initialCount={data.count}
        initialMaxCount={data.max_count}
        initialTicketsSold={data.tickets_sold}
      />
      {/* <RefreshOnFocus /> */}
    </main>
  );
}
