import { getAuth, getCurrentUser } from '../../../src/lib/auth';
import { upsertUser } from '../../../src/lib/userRepository';
import { getProfile } from '../../../src/lib/profileRepository';
import { getJobDescriptionById } from '../../../src/lib/jobDescription/jobDescriptionRepository';
import { createResume } from '../../../src/lib/resumeRepository';
import { tailorResume } from '../../../src/ai/tailor';
import { TailorRequestSchema } from '../../../src/ai/schemas';

export const maxDuration = 60;
export const runtime = 'nodejs';

async function ensureUser(userId: string): Promise<void> {
  const user = await getCurrentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.local`;
  await upsertUser(userId, email);
}

export async function POST(request: Request): Promise<Response> {
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

  const parsed = TailorRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request';
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    await ensureUser(userId);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Load profile + JD scoped to the session user. Cross-user JD access
  // returns 404 (not 403) to avoid leaking whether the id exists.
  const profile = await getProfile(userId);
  if (!profile) {
    return Response.json({ error: 'Profile required before tailoring' }, { status: 409 });
  }

  const jd = await getJobDescriptionById(parsed.data.jobDescriptionId, userId);
  if (!jd) {
    return Response.json({ error: 'Job description not found' }, { status: 404 });
  }

  try {
    const aiResume = await tailorResume(profile, { id: jd.id, content: jd.content });
    const saved = await createResume(userId, jd.id, aiResume);
    return Response.json({ resumeId: saved.resumeId, resume: saved }, { status: 200 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[api.tailor]', detail);
    return Response.json({ error: 'Failed to generate tailored resume' }, { status: 502 });
  }
}
