'use client';

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useOnAppFocus } from './RefreshOnFocus';
import { getSupabaseClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type CounterData = {
  id: number;
  count: number;
  max_count: number;
  tickets_sold: number;
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
  projectId,
  projectName,
  initialCount,
  initialMaxCount,
  initialTicketsSold,
  children,
}: PropsWithChildren<{
  projectId: number;
  projectName: string;
  initialCount: number;
  initialMaxCount: number;
  initialTicketsSold: number;
}>) => {
  const [count, setCount] = useState<number>(initialCount);
  const [maxCount, setMaxCount] = useState<number>(initialMaxCount);
  const [ticketsSold, setTicketsSold] = useState<number>(initialTicketsSold);

  const [error, setError] = useState<string | null>(null);

  useOnAppFocus(async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('event_counter')
      .select('*')
      .eq('id', projectId)
      .single();

    if (data) {
      setCount(data.count);
      setMaxCount(data.max_count);
      setTicketsSold(data.tickets_sold);
    }
  }, 5_000);
  // Fetch initial count and subscribe to real-time updates
  useEffect(() => {
    const supabase = getSupabaseClient();
    let subscription: RealtimeChannel | null = null;

    const initializeCounter = async () => {
      if (projectId == null) {
        return;
      }
      try {
        setError(null);
        // Subscribe to real-time updates
        subscription = supabase
          .channel('event_counter_channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'event_counter',
              filter: `id=eq.${projectId}`,
            },
            (payload) => {
              if (payload.new && typeof payload.new === 'object') {
                const newData = payload.new as CounterData;
                setCount(newData.count);
                setMaxCount(newData.max_count);
                setTicketsSold(newData.tickets_sold);
              }
            },
          )
          .subscribe();
      } catch (err) {
        console.error('Error initializing counter:', err);
        setError('An error occurred');
      }
    };

    initializeCounter();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [projectId]);

  // Increment counter
  const incrementCount = async () => {
    try {
      const supabase = getSupabaseClient();
      const previousCount = count;
      const newCount = (count ?? 0) + 1;

      // Optimistic update
      setCount(newCount);
      setError(null);

      const { error: updateError } = await supabase.rpc('update_occupancy', {
        p_counter_id: projectId,
        p_delta: 1,
        p_source: 'main-door',
      });

      if (updateError) {
        // Revert on error
        setCount(previousCount);
        setError('Failed to increment counter');
        console.error('Update error:', updateError);
      }
    } catch (err) {
      setError('Failed to increment counter');
      console.error('Error incrementing counter:', err);
    }
  };

  // Decrement counter (ensure it doesn't go below 0)
  const decrementCount = async () => {
    if (count === null || count <= 0) return;

    try {
      const supabase = getSupabaseClient();
      const previousCount = count;
      const newCount = Math.max(0, (count ?? 0) - 1);

      // Optimistic update
      setCount(newCount);
      setError(null);

      const { error: updateError } = await supabase.rpc('update_occupancy', {
        p_counter_id: projectId,
        p_delta: -1,
        p_source: 'main-door',
      });

      if (updateError) {
        // Revert on error
        setCount(previousCount);
        setError('Failed to decrement counter');
        console.error('Update error:', updateError);
      }
    } catch (err) {
      setError('Failed to decrement counter');
      console.error('Error decrementing counter:', err);
    }
  };

  const buyTickets = async (numberOfTickets: number) => {
    try {
      const supabase = getSupabaseClient();
      const previousTicketsSold = ticketsSold;
      const newTicketsSold = Math.max(
        0,
        (previousTicketsSold ?? 0) + numberOfTickets,
      );

      // Optimistic update
      setTicketsSold(newTicketsSold);
      setError(null);

      const { error: updateError } = await supabase.rpc(
        'update_tickets_sold',
        {
          p_counter_id: projectId,
          p_delta: numberOfTickets,
          p_source: 'ticket_office',
        },
      );

      if (updateError) {
        // Revert on error
        setTicketsSold(previousTicketsSold);
        setError('Failed to update ticket counter');
        console.error('Update error:', updateError);
      }
    } catch (err) {
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
