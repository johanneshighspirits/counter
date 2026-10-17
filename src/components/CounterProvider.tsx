'use client';

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useOnAppFocus } from './RefreshOnFocus';
import { getDb, updateCounter } from '@/lib/firebase';

export type CounterData = {
  name: string;
  count: number;
  maxCount: number;
  ticketsSold: number;
};

type CounterContextType = {
  count: number;
  maxCount: number;
  ticketsSold: number;
  incrementCount: () => Promise<void>;
  decrementCount: () => Promise<void>;
  buyTickets: (nrOfTickets: number) => Promise<void>;
  error: string | null;
};

const CounterContext = createContext<CounterContextType | undefined>(undefined);

export const CounterProvider = ({
  teamSlug,
  eventSlug,
  initialCount,
  initialMaxCount,
  initialTicketsSold,
  children,
}: PropsWithChildren<{
  teamSlug: string;
  eventSlug: string;
  initialCount: number;
  initialMaxCount: number;
  initialTicketsSold: number;
}>) => {
  const [count, setCount] = useState<number>(initialCount);
  const [maxCount, setMaxCount] = useState<number>(initialMaxCount);
  const [ticketsSold, setTicketsSold] = useState<number>(initialTicketsSold);

  const [error, setError] = useState<string | null>(null);

  const applyData = (data: CounterData | undefined) => {
    if (data) {
      setCount(data.count);
      setMaxCount(data.maxCount);
      setTicketsSold(data.ticketsSold);
    }
  };

  useOnAppFocus(async () => {
    const snapshot = await getDoc(doc(getDb(), 'teams', teamSlug, 'events', eventSlug));
    applyData(snapshot.data() as CounterData | undefined);
  }, 5_000);

  // Subscribe to real-time updates
  useEffect(() => {
    return onSnapshot(
      doc(getDb(), 'teams', teamSlug, 'events', eventSlug),
      (snapshot) => applyData(snapshot.data() as CounterData | undefined),
      (err) => {
        console.error('Error subscribing to counter:', err);
        setError('An error occurred');
      },
    );
  }, [teamSlug, eventSlug]);

  // Increment counter
  const incrementCount = async () => {
    const previousCount = count;
    try {
      // Optimistic update
      setCount((count ?? 0) + 1);
      setError(null);

      await updateCounter(teamSlug, eventSlug, 'occupancy', 1, 'main-door');
    } catch (err) {
      // Revert on error
      setCount(previousCount);
      setError('Failed to increment counter');
      console.error('Error incrementing counter:', err);
    }
  };

  // Decrement counter (ensure it doesn't go below 0)
  const decrementCount = async () => {
    if (count === null || count <= 0) return;

    const previousCount = count;
    try {
      // Optimistic update
      setCount(Math.max(0, (count ?? 0) - 1));
      setError(null);

      await updateCounter(teamSlug, eventSlug, 'occupancy', -1, 'main-door');
    } catch (err) {
      // Revert on error
      setCount(previousCount);
      setError('Failed to decrement counter');
      console.error('Error decrementing counter:', err);
    }
  };

  const buyTickets = async (numberOfTickets: number) => {
    const previousTicketsSold = ticketsSold;
    try {
      // Optimistic update
      setTicketsSold(Math.max(0, (previousTicketsSold ?? 0) + numberOfTickets));
      setError(null);

      await updateCounter(
        teamSlug,
        eventSlug,
        'tickets',
        numberOfTickets,
        'ticket_office',
      );
    } catch (err) {
      // Revert on error
      setTicketsSold(previousTicketsSold);
      setError('Failed to update ticket counter');
      console.error('Error updating tickets counter:', err);
    }
  };

  const value = {
    count,
    incrementCount,
    decrementCount,
    maxCount,
    buyTickets,
    ticketsSold,
    error,
  };
  return (
    <CounterContext.Provider value={value}>{children}</CounterContext.Provider>
  );
};

export const useCounter = () => {
  const ctx = useContext(CounterContext);
  if (!ctx) {
    throw new Error('useCounter must be used in a CounterProvider');
  }
  return ctx;
};
