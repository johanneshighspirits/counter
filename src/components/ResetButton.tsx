'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const ResetButton = ({
  url,
  confirmMessage,
  label = 'Reset counter',
  className = 'p-4',
}: {
  url: string;
  confirmMessage: string;
  label?: string;
  className?: string;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetCounter = async () => {
    // Resetting also deletes the history, so make sure it's on purpose
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset counter');
      }

      // Show the new counts on server-rendered pages
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={resetCounter}
        disabled={isLoading}
        className={`border border-white rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}>
        {isLoading ? 'Resetting...' : label}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
};
