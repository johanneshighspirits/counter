import { cookies } from 'next/headers';
import Link from 'next/link';
import { ResetButton } from './_components/ResetButton';
import { MaxCountInput } from './_components/MaxCountInput';
import { AdminLogin } from './_components/AdminLogin';

export default async function AdminPage(
  props: PageProps<'/[projectSlug]/admin'>,
) {
  const { projectSlug } = await props.params;

  // Check authentication server-side
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_authenticated');
  const isAuthenticated = !!authCookie && authCookie.value === 'true';

  if (!isAuthenticated) {
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
