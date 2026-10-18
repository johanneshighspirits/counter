import { NextRequest, NextResponse } from 'next/server';
import { adminCookieOptions, getAdminCookieValue } from '@/lib/admin-auth';
import {
  isLoginRateLimited,
  tooManyAttemptsResponse,
} from '@/lib/rate-limit';

// Global admin login: only ADMIN_PASSWORD, never an event PIN
export async function POST(request: NextRequest) {
  try {
    if (await isLoginRateLimited(request)) {
      return tooManyAttemptsResponse();
    }

    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookieValue = getAdminCookieValue();

    if (!adminPassword || !cookieValue) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 },
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set(adminCookieOptions(cookieValue));
    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
