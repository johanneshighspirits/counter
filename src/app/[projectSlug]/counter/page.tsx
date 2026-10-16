import { getProjectScopedServerClient } from '@/lib/supabase-server';
import { Counter } from '@/components/Counter';

export default async function Home(props: PageProps<'/[projectSlug]/counter'>) {
  const { projectSlug } = await props.params;
  // Initial counter data is fetched in the project layout
  const { project } = await getProjectScopedServerClient(projectSlug);

  return <Counter projectName={project.name} />;
}
