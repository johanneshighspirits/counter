import Link from 'next/link';
import { ResetButton } from './_components/ResetButton';
import { MaxCountInput } from './_components/MaxCountInput';

export default async function AdminPage(props: PageProps<'/[project]/admin'>) {
  const { project } = await props.params;
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
