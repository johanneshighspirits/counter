import Link from 'next/link';
import { ResetButton } from './_components/ResetButton';
import { MaxCountInput } from './_components/MaxCountInput';
import { AdminLogin } from './_components/AdminLogin';
import { isAdmin } from '@/lib/admin-auth';

const pages = [
  { path: 'counter', label: 'Counter' },
  { path: 'tickets', label: 'Tickets' },
  { path: 'stats', label: 'Stats' },
  { path: 'menu', label: 'Price list' },
];

export default async function AdminPage(
  props: PageProps<'/[projectSlug]/admin'>,
) {
  const { projectSlug } = await props.params;

  // Check authentication server-side
  if (!(await isAdmin())) {
    return <AdminLogin projectSlug={projectSlug} />;
  }

  return (
    <main>
      <div className="grid place-items-center min-h-dvh">
        <div className="flex flex-col gap-8 items-center">
          <nav className="flex flex-col gap-4 items-center">
            {pages.map((page) => (
              <Link
                key={page.path}
                href={`/${projectSlug}/${page.path}`}
                className="underline underline-offset-2">
                {page.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-6">
            <ResetButton projectSlug={projectSlug} />
            <MaxCountInput projectSlug={projectSlug} />
          </div>
        </div>
      </div>
    </main>
  );
}
