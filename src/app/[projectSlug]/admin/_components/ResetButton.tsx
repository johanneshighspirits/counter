'use client';

import { useState } from 'react';

export const ResetButton = ({ projectSlug }: { projectSlug: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetCounter = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/${projectSlug}/api/counter/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reset counter');
      }

      alert('Counter reset to 0');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      alert(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={resetCounter}
        disabled={isLoading}
        className="border border-white p-4 rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {isLoading ? 'Resetting...' : 'Reset counter'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
};
