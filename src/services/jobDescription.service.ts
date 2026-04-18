import { IngestJDRequestSchema } from '@/ai/schemas';
import type { IngestJDRequest, IngestJDResponse } from '@/ai/schemas';

// Shape the API actually returns — the raw Prisma row. We map it into the
// Phase-0.5 IngestJDResponse so the UI does not have to care.
interface RawJdRow {
  id: string;
  content: string;
  title: string | null;
  company: string | null;
  createdAt: string | Date;
}

function deriveTitle(row: RawJdRow): string {
  if (row.title && row.title.trim()) return row.title.trim();
  const firstLine = row.content.split('\n').find((l) => l.trim().length > 0);
  return firstLine?.trim() ?? 'Untitled';
}

function mapRowToResponse(row: RawJdRow): IngestJDResponse {
  return {
    jobDescriptionId: row.id,
    title: deriveTitle(row),
    company: row.company?.trim() || 'Unknown',
    parsedAt: new Date(row.createdAt).toISOString(),
  };
}

/** List the signed-in user's saved job descriptions, newest first. */
export async function listJobDescriptions(): Promise<IngestJDResponse[]> {
  const res = await fetch('/api/job-descriptions', { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to list job descriptions (${res.status})`);
  }
  const body = (await res.json()) as RawJdRow[] | { jds?: RawJdRow[] };
  const rows = Array.isArray(body) ? body : (body.jds ?? []);
  return rows.map(mapRowToResponse);
}

/** Fetch one JD by id. Returns null on 404 (missing or cross-user). */
export async function getJobDescription(id: string): Promise<IngestJDResponse | null> {
  const res = await fetch(`/api/job-descriptions/${encodeURIComponent(id)}`, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load job description (${res.status})`);
  }
  const body = (await res.json()) as RawJdRow | { jd?: RawJdRow };
  const row = 'jd' in body && body.jd ? body.jd : (body as RawJdRow);
  return mapRowToResponse(row);
}

/**
 * Create a new JD by posting content to the real API. Validates the body
 * client-side first for a faster error path.
 */
export async function createJD(req: IngestJDRequest): Promise<IngestJDResponse> {
  const validated = IngestJDRequestSchema.parse(req);
  const res = await fetch('/api/job-descriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ input: validated.content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `Failed to save job description (${res.status})`);
  }
  const row = (await res.json()) as RawJdRow;
  return mapRowToResponse(row);
}
