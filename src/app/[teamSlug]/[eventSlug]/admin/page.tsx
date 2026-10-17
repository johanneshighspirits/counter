import Link from 'next/link';
import { ResetButton } from './_components/ResetButton';
import { MaxCountInput } from './_components/MaxCountInput';
import { AdminLogin } from './_components/AdminLogin';
import { isAdmin } from '@/lib/admin-auth';

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
            <ResetButton basePath={basePath} />
            <MaxCountInput basePath={basePath} />
          </div>
        </div>
      </div>
    </main>
  );
}
