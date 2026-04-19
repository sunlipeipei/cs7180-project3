import { getAuth, getCurrentUser } from '../../../src/lib/auth';
import { getProfile, saveProfile } from '../../../src/lib/profileRepository';
import { upsertUser } from '../../../src/lib/userRepository';
import { MasterProfileSchema } from '../../../src/ai/schemas';
import { ProfileValidationError } from '../../../src/profile/errors';

async function ensureUser(userId: string): Promise<void> {
  const user = await getCurrentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.local`;
  await upsertUser(userId, email);
}

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
    const profile = await getProfile(userId);
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    return Response.json({ profile }, { status: 200 });
  } catch (err) {
    if (err instanceof ProfileValidationError) {
      return Response.json({ error: 'Stored profile is invalid' }, { status: 500 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<Response> {
  let userId: string | null;
  try {
    ({ userId } = await getAuth());
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

  const parseResult = MasterProfileSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? 'Invalid profile';
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    await ensureUser(userId);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  try {
    await saveProfile(userId, parseResult.data);
    return Response.json({ profile: parseResult.data }, { status: 200 });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
