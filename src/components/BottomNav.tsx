'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Icon paths from Lucide (lucide.dev, ISC license)
const icons = {
  counter: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  tickets: (
    <>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </>
  ),
  stats: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </>
  ),
};

const pages = [
  { path: 'counter', label: 'Räknare' },
  { path: 'tickets', label: 'Biljetter' },
  { path: 'stats', label: 'Statistik' },
] as const;

export const BottomNav = ({ basePath }: { basePath: string }) => {
  const pathname = usePathname();

  // The event home page already links to everything
  if (pathname === basePath) {
    return null;
  }

  return (
    <nav className="sticky bottom-0 w-full border-t border-white/10 bg-black/80 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3 max-w-md mx-auto">
        {pages.map((page) => {
          const href = `${basePath}/${page.path}`;
          const isActive = pathname === href;
          return (
            <li key={page.path}>
              <Link
                href={href}
                aria-label={page.label}
                title={page.label}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'grid place-items-center py-4 select-none touch-manipulation',
                  isActive
                    ? 'text-green-400'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')}>
                <svg
                  className="size-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true">
                  {icons[page.path]}
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
