import { auth } from '@clerk/nextjs/server';
import { parseJobDescription } from '../../../src/lib/jobDescription/parseJobDescription';
import {
  saveJobDescription,
  getJobDescriptionsByUser,
} from '../../../src/lib/jobDescription/jobDescriptionRepository';
import { CreateJdInput } from '../../../src/lib/jobDescription/schemas';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parseResult = CreateJdInput.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? 'Invalid input';
    return Response.json({ error: message }, { status: 400 });
  }

  const { input } = parseResult.data;

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
