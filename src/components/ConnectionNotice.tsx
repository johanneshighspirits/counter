'use client';

import { useCounter } from './CounterProvider';

// Shown while clicks wait for a connection, so volunteers know they still
// count and keep the page open
export const ConnectionNotice = () => {
  const { isSyncDelayed } = useCounter();

  if (!isSyncDelayed) {
    return null;
  }

  return (
    <p
      role="status"
      className="sticky top-0 z-10 w-full bg-amber-950/90 border-b border-amber-400/40 px-4 py-2 text-center text-sm text-amber-200">
      Dålig anslutning. Klicken sparas på enheten och synkas när du är online
      igen. Låt sidan vara öppen.
    </p>
  );
};
