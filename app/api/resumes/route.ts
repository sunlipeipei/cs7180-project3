import { getAuth } from '../../../src/lib/auth';
import { listResumes } from '../../../src/lib/resumeRepository';

export const runtime = 'nodejs';

export async function GET(_request: Request): Promise<Response> {
  let userId: string | null;
  try {
    ({ userId } = await getAuth());
  } catch {
    return Response.json({ error: 'Authentication error' }, { status: 500 });
  }
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resumes = await listResumes(userId);
    return Response.json({ resumes }, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
