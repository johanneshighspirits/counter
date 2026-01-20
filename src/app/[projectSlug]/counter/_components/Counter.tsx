'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { CircularCounter } from '@/components/CircularCounter';
import { useOnAppFocus } from '@/components/RefreshOnFocus';

interface CounterData {
  id: number;
  count: number;
  max_count: number;
}

export function Counter({
  projectId,
  projectName,
  initialCount,
  initialMaxCount,
}: {
  projectId: number;
  projectName: string;
  initialCount: number;
  initialMaxCount: number;
}) {
  const [count, setCount] = useState<number>(initialCount);
  const [maxCount, setMaxCount] = useState<number>(initialMaxCount);
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
    }
  }, 5_000);
  // Fetch initial count and subscribe to real-time updates
  useEffect(() => {
    const supabase = getSupabaseClient();
    let subscription: RealtimeChannel | null = null;

    const initializeCounter = async () => {
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
              filter: 'id=eq.1',
            },
            (payload) => {
              if (payload.new && typeof payload.new === 'object') {
                const newData = payload.new as CounterData;
                setCount(newData.count);
                setMaxCount(newData.max_count);
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
  }, []);

  useEffect(() => {
    if (projectName) {
      globalThis.document.title = `(${count}) ${projectName}`;
    }
  }, [projectName, count]);

  // Increment counter
  const incrementCount = async () => {
    try {
      const supabase = getSupabaseClient();
      const previousCount = count;
      const newCount = (count ?? 0) + 1;

      // Optimistic update
      setCount(newCount);
      setError(null);

      const { error: updateError } = await supabase.rpc('update_counter', {
        p_counter_id: 1,
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

      const { error: updateError } = await supabase.rpc('update_counter', {
        p_counter_id: 1,
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

  return (
    <>
      <div className="text-center px-4 flex flex-col gap-4">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

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

        {/* Info Text */}
        <p className="text-gray-600 text-sm mt-8">
          Changes sync across all devices in real-time
        </p>
      </div>
    </>
  );
}
