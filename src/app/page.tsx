import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
      <div className="text-center px-4 flex flex-col gap-4">
        <h1 className="font-brand text-4xl">Team 17</h1>
        <div className="text-xl flex flex-col gap-4">
          <Link className="hover:underline" href="/team17/counter">
            Räknare
          </Link>
          <Link className="hover:underline" href="/team17/menu">
            Prislista
          </Link>
        </div>
        <Image
          className="mx-auto mt-16 w-auto h-24"
          src="/bajen.png"
          width={1172}
          height={1198}
          alt="Bajen"
        />
      </div>
    </main>
  );
}
