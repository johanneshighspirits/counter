'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Icon paths from Lucide (lucide.dev, ISC license)
const icons = {
  back: <path d="m15 18-6-6 6-6" />,
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

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof icons;
  // Shown next to the icon when the item has the bar to itself
  text?: string;
};

// basePath is "/{team}/{event}"
export const BottomNav = ({ basePath }: { basePath: string }) => {
  const pathname = usePathname();
  const isEventHome = pathname === basePath;
  const teamPath = basePath.slice(0, basePath.lastIndexOf('/'));

  // "<" goes up one level: from the event home to the team, from the
  // other pages to the event home. The event home already links to the
  // other pages, so it only gets the back button.
  const items: NavItem[] = [
    isEventHome
      ? {
          href: teamPath,
          label: 'Alla evenemang',
          icon: 'back',
          text: 'Alla evenemang',
        }
      : { href: basePath, label: 'Tillbaka till evenemanget', icon: 'back' },
    ...(isEventHome
      ? []
      : pages.map((page) => ({
          href: `${basePath}/${page.path}`,
          label: page.label,
          icon: page.path,
        }))),
  ];

  return (
    <nav className="sticky bottom-0 w-full border-t border-white/10 bg-black/80 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className={item.text && 'col-span-full'}>
              <Link
                href={item.href}
                aria-label={item.label}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'py-4 select-none touch-manipulation',
                  item.text
                    ? 'flex items-center gap-1 px-4 text-lg'
                    : 'grid place-items-center',
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
                  {icons[item.icon]}
                </svg>
                {item.text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
