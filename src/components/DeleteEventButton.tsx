'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Deletes the event at basePath. Without redirect, the current page is
// refreshed; with it, goes to the team page, or the start page if the team
// went away with its last event.
export const DeleteEventButton = ({
  basePath,
  eventName,
  label = 'Delete event',
  redirect = false,
  className = 'p-3',
}: {
  basePath: string;
  eventName: string;
  label?: string;
  redirect?: boolean;
  className?: string;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteEvent = async () => {
    if (
      !confirm(
        `Delete ${eventName}? The event, its counters and history are removed for good, and its links stop working.`,
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${basePath}/api/event/delete`, {
        method: 'POST',
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error ?? 'Failed to delete event');
      }

      if (redirect) {
        const teamPath = basePath.slice(0, basePath.lastIndexOf('/'));
        router.replace(body.teamDeleted ? '/' : teamPath);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={deleteEvent}
        disabled={isLoading}
        className={`border border-red-400 text-red-300 rounded-sm hover:bg-red-950/60 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}>
        {isLoading ? 'Deleting...' : label}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
};
