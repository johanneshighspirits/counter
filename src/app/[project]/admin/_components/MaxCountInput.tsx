'use client';

import { useState } from 'react';

export const MaxCountInput = () => {
  const [maxCount, setMaxCount] = useState<string>('300');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMaxCount = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newMaxCount = parseInt(maxCount, 10);
      if (isNaN(newMaxCount) || newMaxCount < 1) {
        throw new Error('Please enter a valid number greater than 0');
      }

      const response = await fetch('/api/counter/max-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxCount: newMaxCount }),
      });

      if (!response.ok) {
        throw new Error('Failed to update max count');
      }

      alert(`Max count updated to ${newMaxCount}`);
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
      <label htmlFor="max-count" className="text-sm font-medium">
        Max Count
      </label>
      <input
        id="max-count"
        type="number"
        value={maxCount}
        onChange={(e) => setMaxCount(e.target.value)}
        disabled={isLoading}
        className="border border-white bg-transparent p-2 rounded-sm text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        min="1"
      />
      <button
        onClick={updateMaxCount}
        disabled={isLoading}
        className="border border-white p-2 rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        {isLoading ? 'Updating...' : 'Update Max Count'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
};
