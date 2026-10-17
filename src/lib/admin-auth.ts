import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getEventPinHash } from '@/lib/event-pin';

export const ADMIN_COOKIE_NAME = 'admin_authenticated';

// Event PIN logins get their own cookie, scoped to the event's path.
// Slugs only contain a-z, 0-9 and "-", so "_" can't be ambiguous.
export const getEventCookieName = (teamSlug: string, eventSlug: string) =>
  `admin_${teamSlug}_${eventSlug}`;

// The cookie holds an HMAC of a fixed message keyed with ADMIN_PASSWORD, so it
// can't be forged without the password and stops working if the password changes.
export const getAdminCookieValue = () => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return null;
  }
  return createHmac('sha256', adminPassword)
    .update('counter-admin')
    .digest('hex');
};

// Same idea for an event PIN, keyed with the stored PIN hash
export const getEventCookieValue = (
  teamSlug: string,
  eventSlug: string,
  pinHash: string,
) =>
  createHmac('sha256', pinHash)
    .update(`counter-admin:${teamSlug}/${eventSlug}`)
    .digest('hex');

const safeEqual = (actual: string | undefined, expected: string | null) =>
  !!expected &&
  !!actual &&
  actual.length === expected.length &&
  timingSafeEqual(Buffer.from(actual), Buffer.from(expected));

// Logged in with ADMIN_PASSWORD (all events) or with the event's PIN
export async function isAdmin(teamSlug: string, eventSlug: string) {
  const cookieStore = await cookies();

  if (safeEqual(cookieStore.get(ADMIN_COOKIE_NAME)?.value, getAdminCookieValue())) {
    return true;
  }

  const eventCookie = cookieStore.get(getEventCookieName(teamSlug, eventSlug));
  if (!eventCookie) {
    return false;
  }

  const pinHash = await getEventPinHash(teamSlug, eventSlug);
  return (
    !!pinHash &&
    safeEqual(
      eventCookie.value,
      getEventCookieValue(teamSlug, eventSlug, pinHash),
    )
  );
}

export const eventCookieOptions = (
  teamSlug: string,
  eventSlug: string,
  pinHash: string,
) => ({
  name: getEventCookieName(teamSlug, eventSlug),
  value: getEventCookieValue(teamSlug, eventSlug, pinHash),
  path: `/${teamSlug}/${eventSlug}`,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
});

export const unauthorizedResponse = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
