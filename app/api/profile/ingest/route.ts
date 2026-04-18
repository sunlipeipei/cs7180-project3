import { getAuth, getCurrentUser } from '../../../../src/lib/auth';
import { upsertUser } from '../../../../src/lib/userRepository';
import { extractText } from '../../../../src/ingestion/pdf';
import { ingestProfileFromText } from '../../../../src/ai/ingestProfile';
import { saveProfile } from '../../../../src/lib/profileRepository';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart/form-data body' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing "file" field' }, { status: 400 });
  }

  if (file.size > MAX_PDF_BYTES) {
    return Response.json({ error: 'File exceeds 10 MB limit' }, { status: 413 });
  }

  // Reject anything the browser did not explicitly tag as application/pdf,
  // including uploads with an empty Content-Type which would otherwise slip
  // through to the parser.
  if (file.type !== 'application/pdf') {
    return Response.json({ error: 'Only application/pdf is accepted' }, { status: 415 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let resumeText: string;
  try {
    resumeText = await extractText(bytes);
  } catch (err) {
    // Keep the real parser message in server logs for debugging, but return
    // a fixed string so we do not leak internal paths/memory addresses to
    // the client (A09).
    const detail = err instanceof Error ? err.message : String(err);
    console.warn('[api.profile.ingest] pdf parse failed:', detail);
    return Response.json({ error: 'Could not parse PDF' }, { status: 400 });
  }

  if (resumeText.trim().length === 0) {
    return Response.json({ error: 'PDF contains no extractable text' }, { status: 400 });
  }

  try {
    await ensureUser(userId);
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  try {
    const profile = await ingestProfileFromText(resumeText);
    await saveProfile(userId, profile);
    return Response.json({ profile }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile ingest failed';
    console.error('[api.profile.ingest]', message);
    return Response.json({ error: 'Failed to parse resume' }, { status: 502 });
  }
}
