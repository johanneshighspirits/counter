import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Use publishable key for client-side compatible operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
      return NextResponse.json(
        {
          error: 'Missing Supabase configuration',
        },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey);

    // Reset counter to 0
    const { error: updateError } = await supabase
      .from('event_counter')
      .update({ count: 0 })
      .eq('id', 1);

    try {
      const { error } = await supabase
        .from('event_counter_log')
        .delete()
        .eq('counter_id', 1);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Could not truncate event_counter_log');
      console.error(error);
    }

    if (updateError) {
      return NextResponse.json(
        {
          error: 'Failed to reset counter',
          details: updateError.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Counter reset to 0',
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
