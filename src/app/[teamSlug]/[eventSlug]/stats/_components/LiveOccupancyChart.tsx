'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useCounter } from '@/components/CounterProvider';
import { getDb } from '@/lib/firebase';
import { toOccupancyByMinute, type LogEntry } from '@/lib/occupancy';
import { OccupancyChart } from './OccupancyChart';

// The server sends the log so far; this keeps it up to date by listening
// only for newer entries, so each new entry costs one read per open page
export const LiveOccupancyChart = ({
  teamSlug,
  eventSlug,
  initialLog,
}: {
  teamSlug: string;
  eventSlug: string;
  initialLog: LogEntry[];
}) => {
  const [log, setLog] = useState(
    () => new Map(initialLog.map((entry) => [entry.id, entry])),
  );
  const [since] = useState(() => initialLog.at(-1)?.createdAt ?? 0);
  // The live totals the chart works back from
  const { count, ticketsSold } = useCounter();

  useEffect(() => {
    const newEntries = query(
      collection(getDb(), 'teams', teamSlug, 'events', eventSlug, 'log'),
      // ">=" and the map keyed by id, since createdAt is stored with more
      // precision than milliseconds
      where('createdAt', '>=', Timestamp.fromMillis(since)),
      orderBy('createdAt'),
    );

    return onSnapshot(
      newEntries,
      (snapshot) => {
        setLog((previous) => {
          const next = new Map(previous);
          for (const change of snapshot.docChanges()) {
            // This device's clicks that haven't reached the server yet have
            // no server time, so use the estimate until they do
            const createdAt = change.doc.get('createdAt', {
              serverTimestamps: 'estimate',
            }) as Timestamp | null;
            if (change.type === 'removed' || !createdAt) {
              next.delete(change.doc.id);
              continue;
            }
            next.set(change.doc.id, {
              id: change.doc.id,
              type: change.doc.get('type'),
              delta: change.doc.get('delta'),
              createdAt: createdAt.toMillis(),
            });
          }
          return next;
        });
      },
      // The chart still shows what the server sent
      (err) => console.error('Error subscribing to the log:', err),
    );
  }, [teamSlug, eventSlug, since]);

  const data = useMemo(
    () =>
      toOccupancyByMinute(
        [...log.values()].sort((a, b) => a.createdAt - b.createdAt),
        { count, ticketsSold },
      ),
    [log, count, ticketsSold],
  );

  return <OccupancyChart data={data} />;
};
