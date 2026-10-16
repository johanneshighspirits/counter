import { getProject } from '@/lib/firebase-server';
import { Counter } from '@/components/Counter';
import { notFound } from 'next/navigation';

export default async function Home(props: PageProps<'/[projectSlug]/counter'>) {
  const { projectSlug } = await props.params;
  // Initial counter data is fetched in the project layout
  const project = await getProject(projectSlug);

  if (!project) {
    notFound();
  }

  return <Counter projectName={project.name} />;
}
