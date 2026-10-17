import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, getEventRef } from '@/lib/firebase-server';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export const PIN_PATTERN = /^\d{4,8}$/;

// PIN hashes live in teams/{team}/events/{event}/private/pin, which the
// security rules don't expose to browsers (unlike the event itself, which
// anyone can read)
export const getEventPinRef = (teamSlug: string, eventSlug: string) =>
  getEventRef(teamSlug, eventSlug).collection('private').doc('pin');

// Stored as "salt:hash"
export async function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scryptAsync(pin, salt, 32);
  return `${salt}:${hash.toString('hex')}`;
}

export async function getEventPinHash(teamSlug: string, eventSlug: string) {
  const snapshot = await getEventPinRef(teamSlug, eventSlug).get();
  return (snapshot.get('pinHash') as string | undefined) ?? null;
}

export const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_MS = 15 * 60_000;

export type PinCheckResult =
  | { ok: true; pinHash: string }
  | { ok: false; reason: 'no-pin' }
  | { ok: false; reason: 'wrong'; attemptsLeft: number }
  | { ok: false; reason: 'locked'; lockedUntil: Date };

// Each try is counted in a transaction *before* the PIN is checked, so
// parallel requests can't sneak in extra guesses. After MAX_PIN_ATTEMPTS
// wrong PINs in a row the event is locked for LOCKOUT_MS.
export async function checkPin(
  teamSlug: string,
  eventSlug: string,
  pin: string,
): Promise<PinCheckResult> {
  const secretRef = getEventPinRef(teamSlug, eventSlug);

  const attempt = await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(secretRef);
    const pinHash = snapshot.get('pinHash') as string | undefined;
    if (!pinHash) {
      return { status: 'no-pin' as const };
    }

    const now = Date.now();
    const lockedUntil = (snapshot.get('lockedUntil') as Timestamp | undefined)
      ?.toMillis();
    if (lockedUntil && lockedUntil > now) {
      return { status: 'locked' as const, lockedUntil };
    }

    // An expired lockout starts the count over
    const attempts =
      (lockedUntil ? 0 : ((snapshot.get('failedAttempts') as number) ?? 0)) + 1;
    transaction.update(secretRef, {
      failedAttempts: attempts,
      lockedUntil:
        attempts >= MAX_PIN_ATTEMPTS
          ? Timestamp.fromMillis(now + LOCKOUT_MS)
          : FieldValue.delete(),
    });

    return { status: 'counted' as const, pinHash, attempts };
  });

  if (attempt.status === 'no-pin') {
    return { ok: false, reason: 'no-pin' };
  }
  if (attempt.status === 'locked') {
    return {
      ok: false,
      reason: 'locked',
      lockedUntil: new Date(attempt.lockedUntil),
    };
  }

  if (await verifyPin(pin, attempt.pinHash)) {
    await secretRef.update({
      failedAttempts: 0,
      lockedUntil: FieldValue.delete(),
    });
    return { ok: true, pinHash: attempt.pinHash };
  }

  const attemptsLeft = MAX_PIN_ATTEMPTS - attempt.attempts;
  return attemptsLeft > 0
    ? { ok: false, reason: 'wrong', attemptsLeft }
    : {
        ok: false,
        reason: 'locked',
        lockedUntil: new Date(Date.now() + LOCKOUT_MS),
      };
}

export async function verifyPin(pin: string, pinHash: string) {
  const [salt, expected] = pinHash.split(':');
  if (!salt || !expected) {
    return false;
  }
  const actual = await scryptAsync(pin, salt, 32);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
