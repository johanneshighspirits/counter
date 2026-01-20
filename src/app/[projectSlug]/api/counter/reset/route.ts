import { getProjectScopedServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[projectSlug]/api/counter/reset'>,
) {
  try {
    const { projectSlug } = await params;
    const { supabase, project } =
      await getProjectScopedServerClient(projectSlug);

    // Reset counter to 0
    const { error: updateError } = await supabase
      .from('event_counter')
      .update({ count: 0 })
      .eq('id', project.id);

    try {
      const { error } = await supabase
        .from('event_counter_log')
        .delete()
        .eq('counter_id', project.id);

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
