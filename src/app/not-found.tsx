import type { Metadata } from 'next';
import Link from 'next/link';
import { BajenLogo } from '@/components/BajenLogo';

export const metadata: Metadata = {
  title: 'Sidan finns inte',
};

// Unknown URLs, and teams or events that don't exist (any more)
export default function NotFound() {
  return (
    <main className="flex items-center justify-center min-h-dvh bg-linear-to-tr from-black to-green-950">
      <div className="w-full max-w-md px-4 py-8 flex flex-col gap-6 text-center">
        <h1 className="font-brand text-4xl">Sidan finns inte</h1>
        <p className="text-slate-400">
          Evenemanget kan ha tagits bort, eller så är länken fel. Fråga den
          som skickade länken om en ny.
        </p>
        <Link
          href="/"
          className="bg-[#0f1a14] border border-white/20 p-4 rounded-lg hover:bg-white hover:text-black transition-colors">
          Till startsidan
        </Link>
        <BajenLogo className="mt-4 h-24" />
      </div>
    </main>
  );
}
