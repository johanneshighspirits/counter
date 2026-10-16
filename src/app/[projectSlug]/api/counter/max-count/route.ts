import { getProject, getProjectRef } from '@/lib/firebase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[projectSlug]/api/counter/max-count'>,
) {
  if (!(await isAdmin())) {
    return unauthorizedResponse();
  }

  try {
    const { projectSlug } = await params;
    const { maxCount } = await request.json();

    if (!maxCount || typeof maxCount !== 'number' || maxCount < 1) {
      return NextResponse.json(
        {
          error: 'Invalid max count value',
        },
        { status: 400 },
      );
    }

    if (!(await getProject(projectSlug))) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update maxCount
    await getProjectRef(projectSlug).update({ maxCount });

    return NextResponse.json(
      {
        success: true,
        message: `Max count updated to ${maxCount}`,
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
