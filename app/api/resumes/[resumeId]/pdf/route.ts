import { getAuth } from '../../../../../src/lib/auth';
import { getResume } from '../../../../../src/lib/resumeRepository';
import { renderResumeToPdf } from '../../../../../src/pdf/render';

export const runtime = 'nodejs';
export const maxDuration = 30;

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

  const resume = await getResume(resumeId, userId);
  if (!resume) {
    return Response.json({ error: 'Resume not found' }, { status: 404 });
  }

  try {
    const bytes = await renderResumeToPdf(resume);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${resumeId}.pdf"`,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[api.pdf]', detail);
    return Response.json({ error: 'Failed to render PDF' }, { status: 500 });
  }
}
