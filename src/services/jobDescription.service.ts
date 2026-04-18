import { IngestJDRequestSchema } from '@/ai/schemas';
import type { IngestJDRequest, IngestJDResponse } from '@/ai/schemas';
import { jobDescriptionsFixture } from '@/fixtures/index';
import { delay, clone } from './_helpers';

// Module-scoped mutable state — seeded from fixture at import time.
const _store = new Map<string, IngestJDResponse>(
  jobDescriptionsFixture.map((jd) => [jd.jobDescriptionId, clone(jd)])
);

/**
 * Returns all job descriptions as a defensive copy array.
 * Simulates ~80ms async latency.
 */
export async function listJobDescriptions(): Promise<IngestJDResponse[]> {
  await delay();
  return Array.from(_store.values()).map(clone);
}

/**
 * Returns a single job description by ID, or null if not found.
 * Simulates ~80ms async latency.
 */
export async function getJobDescription(id: string): Promise<IngestJDResponse | null> {
  await delay();
  const entry = _store.get(id);
  return entry ? clone(entry) : null;
}

/**
 * Validates the request (throws ZodError on invalid input), creates a new JD
 * with a fresh UUID and Phase 0.5 title/company heuristics, stores it, and
 * returns a defensive copy.
 *
 * Heuristics (Phase 0.5):
 *  - title: first non-empty line of content
 *  - company: hardcoded "Unknown" — real parsing lands in Phase 1
 */
export async function createJD(req: IngestJDRequest): Promise<IngestJDResponse> {
  // .parse() throws ZodError on invalid input — intentional service-boundary guard.
  const validated = IngestJDRequestSchema.parse(req);

  const lines = validated.content.split('\n');
  const title = lines.find((l) => l.trim().length > 0) ?? 'Untitled';

  const jd: IngestJDResponse = {
    jobDescriptionId: crypto.randomUUID(),
    title: title.trim(),
    company: 'Unknown',
    parsedAt: new Date().toISOString(),
  };

  await delay();
  _store.set(jd.jobDescriptionId, clone(jd));
  return clone(jd);
}
