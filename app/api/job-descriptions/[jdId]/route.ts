import { getAuth } from '../../../../src/lib/auth';
import { getJobDescriptionById } from '../../../../src/lib/jobDescription/jobDescriptionRepository';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jdId: string }> }
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

  const { jdId } = await params;
  if (!jdId) {
    return Response.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const jd = await getJobDescriptionById(jdId, userId);
    if (!jd) {
      return Response.json({ error: 'Job description not found' }, { status: 404 });
    }
    return Response.json(jd, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
