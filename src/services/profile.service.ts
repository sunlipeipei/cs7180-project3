import { MasterProfileSchema } from '@/ai/schemas';
import type { MasterProfile } from '@/ai/schemas';

/**
 * Fetch the signed-in user's profile from the API.
 * Returns null when the user has not yet ingested or saved one.
 */
export async function getProfile(): Promise<MasterProfile | null> {
  const res = await fetch('/api/profile', { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load profile (${res.status})`);
  }
  const body = await res.json();
  return MasterProfileSchema.parse(body.profile);
}

/**
 * Upsert the signed-in user's profile. Validates locally before sending so
 * UI errors surface immediately without a round-trip.
 */
export async function saveProfile(profile: MasterProfile): Promise<MasterProfile> {
  const validated = MasterProfileSchema.parse(profile);
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `Failed to save profile (${res.status})`);
  }
  const body = await res.json();
  return MasterProfileSchema.parse(body.profile);
}

/**
 * Upload a resume PDF and receive the parsed MasterProfile. The server
 * persists the parse result, so the caller still owns a Save step if the
 * user wants to tweak fields before committing.
 */
export async function ingestProfilePdf(file: File): Promise<MasterProfile> {
  const form = new FormData();
  form.set('file', file);
  const res = await fetch('/api/profile/ingest', { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `Failed to ingest PDF (${res.status})`);
  }
  const body = await res.json();
  return MasterProfileSchema.parse(body.profile);
}
