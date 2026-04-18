import { z } from 'zod';
import { getAuth } from '../../../../../src/lib/auth';
import { getResume, updateResume } from '../../../../../src/lib/resumeRepository';
import { refineResumeSection } from '../../../../../src/ai/refine';
import { ResumeSectionEnum } from '../../../../../src/ai/schemas';

export const maxDuration = 60;
export const runtime = 'nodejs';

const RefineBodySchema = z.object({
  section: ResumeSectionEnum,
  instruction: z.string().min(1).max(1000),
});

export async function POST(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsedBody = RefineBodySchema.safeParse(body);
  if (!parsedBody.success) {
    // Only forward length-based messages (which are user-visible guidance).
    // Enum/invalid_type messages would otherwise echo our full section
    // taxonomy back to the client, which is information disclosure.
    const issue = parsedBody.error.issues[0];
    const message =
      issue?.code === 'too_small' || issue?.code === 'too_big'
        ? issue.message
        : 'Invalid request body';
    return Response.json({ error: message }, { status: 400 });
  }

  const resume = await getResume(resumeId, userId);
  if (!resume) {
    return Response.json({ error: 'Resume not found' }, { status: 404 });
  }

  try {
    const updatedMarkdown = await refineResumeSection(
      resume,
      parsedBody.data.section,
      parsedBody.data.instruction
    );
    const next = { ...resume, [parsedBody.data.section]: updatedMarkdown };
    const saved = await updateResume(resumeId, userId, next);
    return Response.json(
      {
        resumeId,
        section: parsedBody.data.section,
        updatedMarkdown: saved[parsedBody.data.section],
        updatedAt: saved.updatedAt,
      },
      { status: 200 }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[api.refine]', detail);
    return Response.json({ error: 'Failed to refine section' }, { status: 502 });
  }
}
