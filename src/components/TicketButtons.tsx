'use client';

import { useCounter } from './CounterProvider';

const buttons = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
];

export const TicketButtons = () => {
  const { buyTickets } = useCounter();
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-4 my-6">
      {buttons.map((button) => {
        return (
          <li key={button.label}>
            <button
              onClick={() => buyTickets(button.value)}
              className="p-2 rounded-md bg-emerald-800 font-bold text-xl w-full">
              {button.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
