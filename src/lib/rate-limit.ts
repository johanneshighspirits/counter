import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-server';

// Vercel sets x-forwarded-for itself, so clients can't spoof the first entry
export const getClientIp = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

// Counts a request for key and returns whether it is over limit in the
// current fixed window. State lives in rateLimits/, which the security rules
// don't expose to browsers. The key is hashed so IPs aren't stored as is.
export async function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const id = createHash('sha256').update(key).digest('hex');
  const ref = getAdminDb().collection('rateLimits').doc(id);

  return getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const now = Date.now();
    const windowStart = snapshot.get('windowStart') as number | undefined;

    if (!windowStart || now - windowStart >= windowMs) {
      transaction.set(ref, { windowStart: now, count: 1 });
      return false;
    }

    const count = ((snapshot.get('count') as number) ?? 0) + 1;
    transaction.update(ref, { count });
    return count > limit;
  });
}

// Shared by the global and event logins, so guesses can't be spread over them
export const isLoginRateLimited = (request: NextRequest) =>
  isRateLimited(`login:${getClientIp(request)}`, 10, 10 * 60_000);

export const tooManyAttemptsResponse = () =>
  NextResponse.json(
    { error: 'Too many attempts. Wait a while and try again.' },
    { status: 429 },
  );
