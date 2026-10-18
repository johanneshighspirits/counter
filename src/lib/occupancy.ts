// Shared by the server, which loads the log, and the stats page, which keeps
// it up to date in real time

export type LogEntry = {
  id: string;
  type: 'occupancy' | 'tickets';
  delta: number;
  newCount: number;
  // Milliseconds
  createdAt: number;
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
export function toOccupancyByMinute(log: LogEntry[]): OccupancyByMinute[] {
  const events = log.map((entry) => ({
    ...entry,
    minuteMs: Math.floor(entry.createdAt / MINUTE_MS) * MINUTE_MS,
  }));

  if (events.length === 0) {
    return [];
  }

  // Values just before the first logged event of each type
  const firstOf = (type: string) => events.find((e) => e.type === type);
  const firstOccupancy = firstOf('occupancy');
  const firstTickets = firstOf('tickets');
  let peopleInside = firstOccupancy
    ? Math.max(0, firstOccupancy.newCount - firstOccupancy.delta)
    : 0;
  let ticketsSold = firstTickets
    ? Math.max(0, firstTickets.newCount - firstTickets.delta)
    : 0;

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
        peopleInside = event.newCount;
      } else {
        ticketsSold = event.newCount;
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
