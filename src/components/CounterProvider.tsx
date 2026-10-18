'use client';

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useOnAppFocus } from './RefreshOnFocus';
import { getDb, updateCounter } from '@/lib/firebase';

const EVENT_DELETED_MESSAGE =
  'Evenemanget finns inte längre. Det kan ha tagits bort.';

// Clicks are queued while offline, so this is only when the server said no
const clickErrorMessage = (err: unknown) =>
  (err as { code?: string })?.code === 'not-found'
    ? EVENT_DELETED_MESSAGE
    : 'Ett klick kunde inte sparas. Ladda om sidan och kontrollera siffran.';

// How long clicks may wait for the server before the connection notice shows
const SLOW_SYNC_MS = 3_000;

const subscribeToOnline = (onChange: () => void) => {
  globalThis.addEventListener('online', onChange);
  globalThis.addEventListener('offline', onChange);
  return () => {
    globalThis.removeEventListener('online', onChange);
    globalThis.removeEventListener('offline', onChange);
  };
};

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
  incrementCount: () => void;
  decrementCount: () => void;
  buyTickets: (nrOfTickets: number) => void;
  error: string | null;
  // Offline, or clicks have waited a while to reach the server. They are
  // kept on the device and sent when the connection is back.
  isSyncDelayed: boolean;
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
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [isSlowSync, setIsSlowSync] = useState(false);
  const isOnline = useSyncExternalStore(
    subscribeToOnline,
    () => navigator.onLine,
    () => true,
  );

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

  // Real-time updates. The snapshot includes this device's queued clicks, so
  // the numbers change right away, also offline.
  useEffect(() => {
    return onSnapshot(
      doc(getDb(), 'teams', teamSlug, 'events', eventSlug),
      { includeMetadataChanges: true },
      (snapshot) => {
        setHasPendingWrites(snapshot.metadata.hasPendingWrites);
        if (!snapshot.metadata.hasPendingWrites) setIsSlowSync(false);
        if (!snapshot.exists()) {
          // Only the server knows the event is gone, not an empty cache
          if (!snapshot.metadata.fromCache) setError(EVENT_DELETED_MESSAGE);
          return;
        }
        applyData(snapshot.data() as CounterData);
      },
      (err) => {
        console.error('Error subscribing to counter:', err);
        setError('Tappade kontakten med räknaren. Ladda om sidan.');
      },
    );
  }, [teamSlug, eventSlug]);

  // Clicks normally reach the server well within a second
  useEffect(() => {
    if (!hasPendingWrites) return;
    const timeout = setTimeout(() => setIsSlowSync(true), SLOW_SYNC_MS);
    return () => clearTimeout(timeout);
  }, [hasPendingWrites]);

  // Not awaited: offline, the write only resolves once it reaches the server
  const changeCounter = (
    type: 'occupancy' | 'tickets',
    delta: number,
    source: string,
  ) => {
    setError(null);
    updateCounter(teamSlug, eventSlug, type, delta, source).catch((err) => {
      setError(clickErrorMessage(err));
      console.error('Error updating counter:', err);
    });
  };

  const incrementCount = () => changeCounter('occupancy', 1, 'main-door');

  // The rules keep counters from going below 0
  const decrementCount = () => {
    if (count > 0) changeCounter('occupancy', -1, 'main-door');
  };

  const buyTickets = (numberOfTickets: number) => {
    if (ticketsSold + numberOfTickets >= 0) {
      changeCounter('tickets', numberOfTickets, 'ticket_office');
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
    isSyncDelayed: !isOnline || isSlowSync,
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
