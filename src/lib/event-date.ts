// Event dates are stored as "YYYY-MM-DD" strings, so they don't shift with
// time zones
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDate = (date: unknown): date is string =>
  typeof date === 'string' &&
  DATE_PATTERN.test(date) &&
  new Date(`${date}T00:00:00Z`).toISOString().startsWith(date);

// The date in Sweden, so the server and the browser agree on "today"
export const toEventDate = (ms: number) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(
    ms,
  );

// "2026-10-18" -> "18 okt. 2026"
export const formatEventDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const dateTimeFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

// Swedish wall time, "2026-10-18T17:30", the format of datetime-local inputs
export const toEventDateTime = (ms: number) =>
  dateTimeFormat.format(ms).replace(' ', 'T');

export const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

// How far Swedish wall time is ahead of UTC at a moment
const stockholmOffset = (ms: number) =>
  Date.parse(`${toEventDateTime(ms)}:00Z`) - Math.floor(ms / 60_000) * 60_000;

// Swedish wall time "2026-10-18T17:30" -> milliseconds
export const fromEventDateTime = (dateTime: string) => {
  const asUtc = Date.parse(`${dateTime}:00Z`);
  return asUtc - stockholmOffset(asUtc - stockholmOffset(asUtc));
};
