import { cookies } from 'next/headers';
import Link from 'next/link';
import { ResetButton } from './_components/ResetButton';
import { MaxCountInput } from './_components/MaxCountInput';
import { AdminLogin } from './_components/AdminLogin';

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function AdminPage(props: PageProps) {
  const { project } = await props.params;

  // Check authentication server-side
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_authenticated');
  const isAuthenticated = !!authCookie && authCookie.value === 'true';

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <main>
      <div className="grid place-items-center min-h-screen">
        <div className="flex flex-col gap-8 items-center">
          <Link href={`/${project}/counter`}>Back to Counter</Link>
          <Link href={`/${project}/menu`}>Price list</Link>

          <div className="flex flex-col gap-6">
            <ResetButton />
            <MaxCountInput />
          </div>
        </div>
      </div>
    </main>
  );
}
