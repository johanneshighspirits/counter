'use client';

import { useCounter } from './CounterProvider';

const amounts = [1, 2, 3, 4];

export const TicketButtons = () => {
  const { ticketsSold, buyTickets } = useCounter();

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-2 gap-3">
        {amounts.map((amount) => (
          <li key={amount}>
            <button
              onClick={() => buyTickets(amount)}
              className="cursor-pointer w-full h-20 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-600 active:scale-95 text-3xl font-bold shadow-lg transition-transform select-none touch-manipulation"
              aria-label={`Sälj ${amount} ${amount === 1 ? 'biljett' : 'biljetter'}`}>
              +{amount}
            </button>
          </li>
        ))}
      </ul>

      {/* Undo a mistaken sale */}
      <button
        onClick={() => buyTickets(-1)}
        disabled={ticketsSold <= 0}
        className="cursor-pointer w-full h-14 rounded-xl border border-red-400/60 text-red-300 hover:bg-red-950/40 active:bg-red-950/40 active:scale-95 text-lg font-semibold transition-transform select-none touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        aria-label="Ta bort 1 biljett">
        −1 (ångra)
      </button>
    </div>
  );
};
