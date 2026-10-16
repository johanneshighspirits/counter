import type { Metadata } from 'next';
import { getProject } from '@/lib/firebase-server';
import { TicketCounter } from '@/components/TicketCounter';
import { notFound } from 'next/navigation';

// Initial title from the server; TicketCounter keeps it updated afterwards
export async function generateMetadata(
  props: PageProps<'/[projectSlug]/tickets'>,
): Promise<Metadata> {
  const { projectSlug } = await props.params;
  const project = await getProject(projectSlug);

  return project
    ? { title: `(${project.ticketsSold}) Biljetter · ${project.name}` }
    : {};
}

export default async function TicketsPage(
  props: PageProps<'/[projectSlug]/tickets'>,
) {
  const { projectSlug } = await props.params;
  // Initial counter data is fetched in the project layout
  const project = await getProject(projectSlug);

  if (!project) {
    notFound();
  }

  return <TicketCounter projectName={project.name} />;
}
