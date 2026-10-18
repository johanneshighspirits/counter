'use client';

import { useEffect } from 'react';
import { CircularCounter } from './CircularCounter';
import { useCounter } from './CounterProvider';
import { TicketButtons } from './TicketButtons';

// eventTitle is "Julmarknad · Team 16"
export const TicketCounter = ({ eventTitle }: { eventTitle: string }) => {
  const { count, ticketsSold, error } = useCounter();

  useEffect(() => {
    if (eventTitle) {
      globalThis.document.title = `(${ticketsSold}) Biljetter · ${eventTitle}`;
    }
  }, [eventTitle, ticketsSold]);

  return (
    <div className="w-full max-w-md px-4 pt-6 my-auto flex flex-col gap-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          {error}
        </div>
      )}

      <h1 className="text-center text-xl text-slate-400">Sålda biljetter</h1>

      <CircularCounter count={ticketsSold} />

      <TicketButtons />

      <p className="text-center">
        <span className="text-slate-400">Nuvarande besökare: </span>
        <span className="font-mono font-bold">{count}</span>
      </p>
    </div>
  );
};
