'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const ChangePinButton = ({ basePath }: { basePath: string }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setIsEditing(false);
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${basePath}/api/admin/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to change PIN');
      }

      close();
      // Update the PIN status shown on the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="border border-white px-4 py-2 text-sm rounded-sm hover:bg-white hover:text-black transition-colors">
        Change PIN
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          pattern="\d{4,8}"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="New PIN"
          aria-label="New PIN"
          maxLength={8}
          disabled={isLoading}
          className="w-28 border border-white bg-transparent px-2 py-2 text-sm rounded-sm text-white placeholder-gray-400 font-mono disabled:opacity-50"
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || pin.length < 4}
          className="border border-white px-3 py-2 text-sm rounded-sm hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={close}
          disabled={isLoading}
          className="px-2 py-2 text-sm text-slate-400 hover:text-white">
          Cancel
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
};
