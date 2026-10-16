import Link from 'next/link';
import { ResetButton } from './_components/ResetButton';
import { MaxCountInput } from './_components/MaxCountInput';
import { AdminLogin } from './_components/AdminLogin';
import { isAdmin } from '@/lib/admin-auth';

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
          <Link href={`/${projectSlug}/counter`}>Back to Counter</Link>
          <Link href={`/${projectSlug}/menu`}>Price list</Link>

          <div className="flex flex-col gap-6">
            <ResetButton projectSlug={projectSlug} />
            <MaxCountInput projectSlug={projectSlug} />
          </div>
        </div>
      </div>
    </main>
  );
}
