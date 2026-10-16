'use client';

import { CircularCounter } from './CircularCounter';
import { useCounter } from './CounterProvider';
import { TicketButtons } from './TicketButtons';

export const TicketCounter = () => {
  const { ticketsSold } = useCounter();
  return (
    <div className="my-auto">
      <CircularCounter count={ticketsSold} />
      <TicketButtons />
    </div>
  );
};
