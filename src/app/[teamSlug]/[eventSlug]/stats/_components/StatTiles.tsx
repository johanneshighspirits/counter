'use client';

import { useCounter } from '@/components/CounterProvider';

// Live totals from the shared counter state
export const StatTiles = () => {
  const { count, ticketsSold } = useCounter();
  const tiles = [
    { label: 'Nuvarande besökare', value: count },
    { label: 'Sålda biljetter', value: ticketsSold },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-xl bg-[#0f1a14] p-4 flex flex-col gap-1">
          <span className="text-sm text-gray-400">{tile.label}</span>
          <span className="text-4xl font-bold font-mono tabular-nums">
            {tile.value}
          </span>
        </div>
      ))}
    </div>
  );
};
