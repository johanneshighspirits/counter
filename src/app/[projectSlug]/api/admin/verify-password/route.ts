import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminCookieValue } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  // { params }: RouteContext<'/[projectSlug]/api/admin/verify-password'>,
) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const cookieValue = getAdminCookieValue();

    if (!adminPassword || !cookieValue) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 },
      );
    }

    if (password === adminPassword) {
      // Set a secure httpOnly cookie for session management
      const response = NextResponse.json({ success: true }, { status: 200 });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: cookieValue,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
