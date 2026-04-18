import {
  TailoredResumeSchema,
  RefineResponseSchema,
  type TailoredResume,
  type TailorRequest,
  type RefineRequest,
  type RefineResponse,
} from '@/ai/schemas';

/**
 * Fetch all resumes the signed-in user has ever tailored, newest first.
 * Returns an empty array when the user has none yet.
 */
export async function listResumes(): Promise<TailoredResume[]> {
  const res = await fetch('/api/resumes', { method: 'GET' });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to list resumes (${res.status})`);
  const body = await res.json();
  return (body.resumes ?? []).map((r: unknown) => TailoredResumeSchema.parse(r));
}

/**
 * Fetch a single resume by id. Returns null if the user does not own one
 * with that id (the API returns 404 — we do not distinguish "not found"
 * from "not yours" to avoid information disclosure).
 */
export async function getResume(id: string): Promise<TailoredResume | null> {
  const res = await fetch(`/api/resumes/${encodeURIComponent(id)}`, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load resume (${res.status})`);
  const body = await res.json();
  return TailoredResumeSchema.parse(body.resume);
}

/**
 * Create a tailored resume by asking the backend to run the AI pipeline
 * against the session user's profile and the named job description.
 */
export async function tailorResume(req: TailorRequest): Promise<TailoredResume> {
  if (!req.jobDescriptionId) {
    throw new Error('jobDescriptionId is required');
  }
  const res = await fetch('/api/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescriptionId: req.jobDescriptionId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `Failed to tailor resume (${res.status})`);
  }
  const body = await res.json();
  return TailoredResumeSchema.parse(body.resume);
}

/**
 * Rewrite a single section of an existing resume via a natural-language
 * instruction. Landed in Phase 1.C — Phase 1.B imports the stub so the
 * types line up.
 */
export async function refineSection(req: RefineRequest): Promise<RefineResponse> {
  const res = await fetch(`/api/resumes/${encodeURIComponent(req.resumeId)}/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section: req.section, instruction: req.instruction }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `Failed to refine section (${res.status})`);
  }
  const body = await res.json();
  return RefineResponseSchema.parse(body);
}
