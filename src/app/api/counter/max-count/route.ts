import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
      return NextResponse.json(
        {
          error: 'Missing Supabase configuration',
        },
        { status: 500 }
      );
    }

    const { maxCount } = await request.json();

    if (!maxCount || typeof maxCount !== 'number' || maxCount < 1) {
      return NextResponse.json(
        {
          error: 'Invalid max count value',
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey);

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
