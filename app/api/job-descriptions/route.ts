import { auth } from '@clerk/nextjs/server';
import { parseJobDescription } from '../../../src/lib/jobDescription/parseJobDescription';
import {
  saveJobDescription,
  getJobDescriptionsByUser,
} from '../../../src/lib/jobDescription/jobDescriptionRepository';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { input?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const input = body.input;
  if (!input || typeof input !== 'string' || input.trim() === '') {
    return Response.json({ error: 'input is required' }, { status: 400 });
  }

  try {
    const parsed = await parseJobDescription(input);
    const saved = await saveJobDescription(userId, parsed);
    return Response.json(saved, { status: 201 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 422 });
  }
}

export async function GET(_request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jds = await getJobDescriptionsByUser(userId);
  return Response.json(jds, { status: 200 });
}
