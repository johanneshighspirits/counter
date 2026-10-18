'use client';

import { useEffect } from 'react';
import { CircularCounter } from '@/components/CircularCounter';
import { useCounter } from '@/components/CounterProvider';

// eventTitle is "Julmarknad · Team 16"
export function Counter({ eventTitle }: { eventTitle: string }) {
  const {
    count,
    maxCount,
    ticketsSold,
    incrementCount,
    decrementCount,
    error,
  } = useCounter();

  useEffect(() => {
    if (eventTitle) {
      globalThis.document.title = `(${count}) ${eventTitle}`;
    }
  }, [eventTitle, count]);

  return (
    <div className="text-center px-4 flex flex-col gap-4 m-auto">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <h1 className="text-center text-xl text-slate-400">Nuvarande besökare</h1>

      {/* Counter Display */}
      <CircularCounter count={count} maxCount={maxCount} />

      {/* Buttons */}
      <div className="flex gap-6 justify-center">
        {/* Decrement Button */}
        <button
          onClick={decrementCount}
          disabled={count === null || count <= 0}
          className="cursor-pointer size-20 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-4xl font-bold rounded-full aspect-square transition-colors duration-200 shadow-lg hover:shadow-xl active:scale-95 transform"
          aria-label="Decrement visitor count">
          −
        </button>

        {/* Increment Button */}
        <button
          onClick={incrementCount}
          className="cursor-pointer size-20 bg-green-500 hover:bg-green-600 text-white text-4xl font-bold rounded-full aspect-square transition-colors duration-200 shadow-lg hover:shadow-xl active:scale-95 transform"
          aria-label="Increment visitor count">
          +
        </button>
      </div>

      <p>
        <span className="text-slate-400">Sålda biljetter: </span>
        <span className="font-mono font-bold">{ticketsSold}</span>
      </p>
    </div>
  );
}
