import { getAdminDb, getProject, getProjectRef } from '@/lib/firebase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorizedResponse } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: RouteContext<'/[projectSlug]/api/counter/reset'>,
) {
  if (!(await isAdmin())) {
    return unauthorizedResponse();
  }

  try {
    const { projectSlug } = await params;
    if (!(await getProject(projectSlug))) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectRef = getProjectRef(projectSlug);

    // Reset counter and ticketsSold to 0
    await projectRef.update({ count: 0, ticketsSold: 0 });

    try {
      await getAdminDb().recursiveDelete(projectRef.collection('log'));
    } catch (error) {
      console.error('Could not clear counter log');
      console.error(error);
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
