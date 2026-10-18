'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LogSummary } from '@/lib/firebase-server';
import { toEventDateTime } from '@/lib/event-date';
import { buttonClassName, inputClassName } from './SettingField';

const formatTime = (ms: number) => toEventDateTime(ms).replace('T', ' ');

export const TrimLogForm = ({
  basePath,
  eventDate,
  summary,
}: {
  basePath: string;
  eventDate: string;
  summary: LogSummary;
}) => {
  const router = useRouter();
  // Test clicks usually happen on the days before the event
  const [keepFrom, setKeepFrom] = useState(`${eventDate}T00:00`);
  const [keepTo, setKeepTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    { ok: true; deleted: number } | { ok: false; error: string } | null
  >(null);

  const trimLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const range = keepTo
      ? `before ${keepFrom.replace('T', ' ')} and after ${keepTo.replace('T', ' ')}`
      : `before ${keepFrom.replace('T', ' ')}`;
    if (!confirm(`Delete all log entries ${range}? This can't be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      setStatus(null);

      const response = await fetch(`${basePath}/api/counter/trim-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keepFrom, keepTo: keepTo || null }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? 'Failed to trim log');
      }

      setStatus({ ok: true, deleted: body.deleted });
      // Show the new summary
      router.refresh();
    } catch (err) {
      setStatus({
        ok: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty =
    summary.entries === 0 || summary.first === null || summary.last === null;

  return (
    <form onSubmit={trimLog} className="flex flex-col gap-4">
      {isEmpty ? (
        <p className="text-sm text-slate-400">The log is empty</p>
      ) : (
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-slate-400">Entries</dt>
            <dd className="font-mono font-bold">{summary.entries}</dd>
          </div>
          <div>
            <dt className="text-slate-400">First</dt>
            <dd className="tabular-nums">{formatTime(summary.first!)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Last</dt>
            <dd className="tabular-nums">{formatTime(summary.last!)}</dd>
          </div>
        </dl>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Keep from</span>
          <input
            type="datetime-local"
            value={keepFrom}
            onChange={(e) => setKeepFrom(e.target.value)}
            disabled={isLoading || isEmpty}
            className={`${inputClassName} min-w-0`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Keep until (optional)</span>
          <input
            type="datetime-local"
            value={keepTo}
            onChange={(e) => setKeepTo(e.target.value)}
            disabled={isLoading || isEmpty}
            className={`${inputClassName} min-w-0`}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !keepFrom || isEmpty}
        className={buttonClassName}>
        {isLoading ? 'Deleting...' : 'Delete entries outside this range'}
      </button>

      {status?.ok && (
        <p className="text-green-400 text-sm">
          Deleted {status.deleted} {status.deleted === 1 ? 'entry' : 'entries'}
        </p>
      )}
      {status && !status.ok && (
        <p className="text-red-400 text-sm">{status.error}</p>
      )}
      <p className="text-xs text-slate-500">
        Times are Swedish time. The counters keep their values.
      </p>
    </form>
  );
};
