import { TailorRequestSchema, RefineRequestSchema } from '@/ai/schemas';
import type { TailoredResume, TailorRequest, RefineRequest, RefineResponse } from '@/ai/schemas';
import { resumesFixture } from '@/fixtures/index';
import { delay, clone } from './_helpers';

// Module-scoped mutable state — seeded from fixture at import time.
const _store = new Map<string, TailoredResume>(resumesFixture.map((r) => [r.resumeId, clone(r)]));

/**
 * Returns all resumes as a defensive copy array.
 * Simulates ~80ms async latency.
 */
export async function listResumes(): Promise<TailoredResume[]> {
  await delay();
  return Array.from(_store.values()).map(clone);
}

/**
 * Returns a single resume by ID, or null if not found.
 * Simulates ~80ms async latency.
 */
export async function getResume(id: string): Promise<TailoredResume | null> {
  await delay();
  const entry = _store.get(id);
  return entry ? clone(entry) : null;
}

/**
 * Validates the request (throws ZodError on invalid input), builds a stub
 * TailoredResume with placeholder markdown, stores it, and returns a
 * defensive copy.
 *
 * Phase 0.5 note: sections are placeholder text only. Real tailoring via
 * Claude API lands in Phase 1.D.
 */
export async function tailorResume(req: TailorRequest): Promise<TailoredResume> {
  // .parse() throws ZodError on invalid input — intentional service-boundary guard.
  const validated = TailorRequestSchema.parse(req);

  const now = new Date().toISOString();
  const resume: TailoredResume = {
    resumeId: crypto.randomUUID(),
    jobDescriptionId: validated.jobDescriptionId,
    header: '# [Tailored header placeholder]',
    summary: '## Summary\n\n[Tailored summary placeholder]',
    skills: '## Skills\n\n[Tailored skills placeholder]',
    experience: '## Experience\n\n[Tailored experience placeholder]',
    education: '## Education\n\n[Tailored education placeholder]',
    projects: '## Projects\n\n[Tailored projects placeholder]',
    updatedAt: now,
  };

  await delay();
  _store.set(resume.resumeId, clone(resume));
  return clone(resume);
}

/**
 * Validates the request (throws ZodError on invalid input), looks up the
 * resume (throws if not found), appends the refinement instruction to the
 * section's existing markdown, updates the store, and returns a RefineResponse.
 *
 * Append format: `${existing}\n\n> Refined: ${instruction}`
 */
export async function refineSection(req: RefineRequest): Promise<RefineResponse> {
  // .parse() throws ZodError on invalid input — intentional service-boundary guard.
  const validated = RefineRequestSchema.parse(req);

  const stored = _store.get(validated.resumeId);
  if (!stored) {
    throw new Error(`Resume not found: ${validated.resumeId}`);
  }

  const existing = stored[validated.section];
  const updatedMarkdown = `${existing}\n\n> Refined: ${validated.instruction}`;
  const updatedAt = new Date().toISOString();

  const updated: TailoredResume = {
    ...stored,
    [validated.section]: updatedMarkdown,
    updatedAt,
  };

  await delay();
  _store.set(validated.resumeId, clone(updated));

  return {
    resumeId: validated.resumeId,
    section: validated.section,
    updatedMarkdown,
    updatedAt,
  };
}
