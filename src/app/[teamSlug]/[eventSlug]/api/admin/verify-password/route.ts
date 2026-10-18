import { NextRequest, NextResponse } from 'next/server';
import {
  adminCookieOptions,
  eventCookieOptions,
  getAdminCookieValue,
} from '@/lib/admin-auth';
import { checkPin } from '@/lib/event-pin';
import {
  isLoginRateLimited,
  tooManyAttemptsResponse,
} from '@/lib/rate-limit';

// Accepts either the event's PIN or the global ADMIN_PASSWORD
export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[teamSlug]/[eventSlug]/api/admin/verify-password'>,
) {
  try {
    if (await isLoginRateLimited(request)) {
      return tooManyAttemptsResponse();
    }

    const { teamSlug, eventSlug } = await params;
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookieValue = getAdminCookieValue();

    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (adminPassword && cookieValue && password === adminPassword) {
      // Set a secure httpOnly cookie for session management
      const response = NextResponse.json({ success: true }, { status: 200 });

      response.cookies.set(adminCookieOptions(cookieValue));

      return response;
    }

    const result = await checkPin(teamSlug, eventSlug, password);

    if (result.ok) {
      const response = NextResponse.json({ success: true }, { status: 200 });
      response.cookies.set(
        eventCookieOptions(teamSlug, eventSlug, result.pinHash),
      );
      return response;
    }

    if (result.reason === 'locked') {
      const minutes = Math.ceil(
        (result.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      return NextResponse.json(
        {
          error: `Too many wrong attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        },
        { status: 429 },
      );
    }

    if (result.reason === 'wrong') {
      return NextResponse.json(
        {
          error: `Wrong PIN, ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} left`,
        },
        { status: 401 },
      );
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
