import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_authenticated');

    return NextResponse.json({
      authenticated: !!authCookie && authCookie.value === 'true',
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
