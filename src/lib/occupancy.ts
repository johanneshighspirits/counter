// Shared by the server, which loads the log, and the stats page, which keeps
// it up to date in real time

export type LogEntry = {
  id: string;
  type: 'occupancy' | 'tickets';
  delta: number;
  // Milliseconds
  createdAt: number;
};

export type Totals = {
  count: number;
  ticketsSold: number;
};

export type OccupancyByMinute = {
  minute: string;
  entries: number;
  exits: number;
  people_inside: number;
  tickets_sold: number;
  // A quiet stretch was skipped right before this minute
  gapBefore: boolean;
};

const MINUTE_MS = 60_000;
// Quiet stretches longer than this are left out of the stats, e.g. the days
// between test clicks and the event itself
const MAX_GAP_MS = 60 * MINUTE_MS;

// Entries and exits per minute, plus people inside and tickets sold at the
// end of each minute. The log must be sorted by createdAt.
//
// Every counter change has a log entry (the security rules make sure), so
// working back from the current totals gives the values before the first
// entry, also when older entries were trimmed away.
export function toOccupancyByMinute(
  log: LogEntry[],
  totals: Totals,
): OccupancyByMinute[] {
  const events = log.map((entry) => ({
    ...entry,
    minuteMs: Math.floor(entry.createdAt / MINUTE_MS) * MINUTE_MS,
  }));

  if (events.length === 0) {
    return [];
  }

  // Values just before the first logged event
  const sumOf = (type: LogEntry['type']) =>
    events.reduce((sum, e) => (e.type === type ? sum + e.delta : sum), 0);
  let peopleInside = Math.max(0, totals.count - sumOf('occupancy'));
  let ticketsSold = Math.max(0, totals.ticketsSold - sumOf('tickets'));

  const result: OccupancyByMinute[] = [];
  let eventIndex = 0;
  let minuteMs = events[0].minuteMs;
  let gapBefore = false;

  while (eventIndex < events.length) {
    let entries = 0;
    let exits = 0;

    while (
      eventIndex < events.length &&
      events[eventIndex].minuteMs === minuteMs
    ) {
      const event = events[eventIndex];
      if (event.type === 'occupancy') {
        if (event.delta > 0) entries += event.delta;
        if (event.delta < 0) exits += Math.abs(event.delta);
        peopleInside = Math.max(0, peopleInside + event.delta);
      } else {
        ticketsSold = Math.max(0, ticketsSold + event.delta);
      }
      eventIndex++;
    }

    result.push({
      minute: new Date(minuteMs).toISOString(),
      entries,
      exits,
      people_inside: peopleInside,
      tickets_sold: ticketsSold,
      gapBefore,
    });

    const nextMinuteMs = events[eventIndex]?.minuteMs;
    gapBefore =
      nextMinuteMs !== undefined && nextMinuteMs - minuteMs > MAX_GAP_MS;
    minuteMs = gapBefore ? nextMinuteMs : minuteMs + MINUTE_MS;
  }

  return result;
}
