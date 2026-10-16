import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ADMIN_COOKIE_NAME = 'admin_authenticated';

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

export async function isAdmin() {
  const expected = getAdminCookieValue();
  const actual = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;

  if (!expected || !actual || actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export const unauthorizedResponse = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
