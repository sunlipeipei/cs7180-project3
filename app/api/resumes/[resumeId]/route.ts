import { getAuth } from '../../../../src/lib/auth';
import { getResume } from '../../../../src/lib/resumeRepository';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resumeId: string }> }
): Promise<Response> {
  let userId: string | null;
  try {
    ({ userId } = await getAuth());
  } catch {
    return Response.json({ error: 'Authentication error' }, { status: 500 });
  }
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { resumeId } = await params;
  if (!resumeId) {
    return Response.json({ error: 'Invalid resume id' }, { status: 400 });
  }

  try {
    const resume = await getResume(resumeId, userId);
    if (!resume) {
      return Response.json({ error: 'Resume not found' }, { status: 404 });
    }
    return Response.json({ resume }, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
