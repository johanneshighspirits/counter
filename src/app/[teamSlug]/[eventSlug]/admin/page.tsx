import Link from 'next/link';
import { MaxCountInput } from './_components/MaxCountInput';
import { AdminLogin } from '@/components/AdminLogin';
import { ResetButton } from '@/components/ResetButton';
import { isAdmin } from '@/lib/admin-auth';
import { getEvent } from '@/lib/firebase-server';

const pages = [
  { path: '', label: 'Home' },
  { path: 'counter', label: 'Counter' },
  { path: 'tickets', label: 'Tickets' },
  { path: 'stats', label: 'Stats' },
];

export default async function AdminPage(
  props: PageProps<'/[teamSlug]/[eventSlug]/admin'>,
) {
  const { teamSlug, eventSlug } = await props.params;
  const basePath = `/${teamSlug}/${eventSlug}`;

  // Check authentication server-side
  if (!(await isAdmin(teamSlug, eventSlug))) {
    return <AdminLogin basePath={basePath} />;
  }

  const event = await getEvent(teamSlug, eventSlug);

  return (
    <main>
      <div className="grid place-items-center min-h-dvh">
        <div className="flex flex-col gap-8 items-center">
          <nav className="flex flex-col gap-4 items-center">
            {pages.map((page) => (
              <Link
                key={page.path}
                href={`${basePath}${page.path && `/${page.path}`}`}
                className="underline underline-offset-2">
                {page.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-6">
            <ResetButton
              url={`${basePath}/api/counter/reset`}
              confirmMessage={`Reset ${event?.name ?? eventSlug}? This sets both counters to 0 and deletes the history.`}
            />
            <MaxCountInput
              basePath={basePath}
              initialMaxCount={event?.maxCount || 150}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
