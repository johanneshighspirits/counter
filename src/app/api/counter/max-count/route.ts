import { getSupabaseServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { maxCount } = await request.json();

    if (!maxCount || typeof maxCount !== 'number' || maxCount < 1) {
      return NextResponse.json(
        {
          error: 'Invalid max count value',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // Update max_count
    const { error: updateError } = await supabase
      .from('event_counter')
      .update({ max_count: maxCount })
      .eq('id', 1);

    if (updateError) {
      return NextResponse.json(
        {
          error: 'Failed to update max count',
          details: updateError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Max count updated to ${maxCount}`,
      },
      { status: 200 }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
