import { auth, currentUser } from '@clerk/nextjs/server';
import { parseJobDescription } from '../../../src/lib/jobDescription/parseJobDescription';
import {
  saveJobDescription,
  getJobDescriptionsByUser,
} from '../../../src/lib/jobDescription/jobDescriptionRepository';
import { CreateJdInput } from '../../../src/lib/jobDescription/schemas';
import { upsertUser } from '../../../src/lib/userRepository';

async function ensureUser(userId: string) {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.local`;
  await upsertUser(userId, email);
}

export async function POST(request: Request) {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return Response.json({ error: 'Authentication error' }, { status: 500 });
  }
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
    await ensureUser(userId);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
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
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return Response.json({ error: 'Authentication error' }, { status: 500 });
  }
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jds = await getJobDescriptionsByUser(userId);
    return Response.json(jds, { status: 200 });
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
