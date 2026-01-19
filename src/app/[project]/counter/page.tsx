import { getProjectScopedServerClient } from '@/lib/supabase-server';
import { Counter } from './_components/Counter';
import { notFound, redirect } from 'next/navigation';
import { RefreshOnFocus } from '@/components/RefreshOnFocus';

export default async function Home(props: PageProps<'/[project]/counter'>) {
  const { project } = await props.params;
  const { supabase } = await getProjectScopedServerClient(project);
  // Fetch initial count and config
  const { data, error: fetchError } = await supabase
    .from('event_counter')
    .select('count, max_count')
    .eq('id', 1)
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
        project={project}
        initialCount={data.count}
        initialMaxCount={data.max_count}
      />
      <RefreshOnFocus />
    </main>
  );
}
