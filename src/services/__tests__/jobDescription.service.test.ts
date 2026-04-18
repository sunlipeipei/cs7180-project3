/**
 * Isolation strategy: each test uses vi.resetModules() + dynamic import so it
 * gets a freshly-seeded module-scoped Map. This prevents cross-test pollution
 * from createJD additions persisting between cases.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IngestJDResponseSchema } from '@/ai/schemas.js';

async function freshService() {
  vi.resetModules();
  return import('../jobDescription.service.js');
}

describe('jobDescription.service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('listJobDescriptions() returns 2 items on cold start (seeded from fixture)', async () => {
    const { listJobDescriptions } = await freshService();
    const list = await listJobDescriptions();
    expect(list).toHaveLength(2);
  });

  it('listJobDescriptions() items all pass Zod IngestJDResponseSchema', async () => {
    const { listJobDescriptions } = await freshService();
    const list = await listJobDescriptions();
    for (const jd of list) {
      expect(IngestJDResponseSchema.safeParse(jd).success).toBe(true);
    }
  });

  it('getJobDescription(knownId) returns the matching JD', async () => {
    const { listJobDescriptions, getJobDescription } = await freshService();
    const list = await listJobDescriptions();
    const known = list[0];
    const result = await getJobDescription(known.jobDescriptionId);
    expect(result).not.toBeNull();
    expect(result?.jobDescriptionId).toBe(known.jobDescriptionId);
    expect(result?.company).toBe(known.company);
  });

  it('getJobDescription("nope") returns null', async () => {
    const { getJobDescription } = await freshService();
    const result = await getJobDescription('nope');
    expect(result).toBeNull();
  });

  it('getJobDescription(unknown-uuid) returns null', async () => {
    const { getJobDescription } = await freshService();
    const result = await getJobDescription('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('createJD returns a valid IngestJDResponse with a fresh UUID', async () => {
    const { createJD } = await freshService();
    const result = await createJD({
      source: 'paste',
      content: 'Senior SWE at Google\n\nFull role description here.',
    });
    const parsed = IngestJDResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    expect(result.jobDescriptionId).toBeTruthy();
  });

  it('createJD adds to the list — length becomes 3', async () => {
    const { listJobDescriptions, createJD } = await freshService();
    await createJD({
      source: 'paste',
      content: 'Senior SWE at Google\n\nFull role description here.',
    });
    const list = await listJobDescriptions();
    expect(list).toHaveLength(3);
  });

  it('createJD with "url" source also works', async () => {
    const { listJobDescriptions, createJD } = await freshService();
    await createJD({ source: 'url', content: 'https://example.com/job/1234' });
    const list = await listJobDescriptions();
    expect(list).toHaveLength(3);
  });

  it('createJD extracts title from first non-empty line', async () => {
    const { createJD } = await freshService();
    const result = await createJD({
      source: 'paste',
      content: 'Staff Engineer – Platform\n\nMore details.',
    });
    expect(result.title).toBe('Staff Engineer – Platform');
  });

  it('createJD sets company to "Unknown" (Phase 0.5 heuristic)', async () => {
    const { createJD } = await freshService();
    const result = await createJD({
      source: 'paste',
      content: 'Some Job Title\n\nJob details here.',
    });
    expect(result.company).toBe('Unknown');
  });

  it('createJD sets parsedAt to current ISO datetime', async () => {
    const { createJD } = await freshService();
    const before = new Date().toISOString();
    const result = await createJD({ source: 'paste', content: 'Some Job Title\n\nJob details.' });
    const after = new Date().toISOString();
    expect(result.parsedAt >= before).toBe(true);
    expect(result.parsedAt <= after).toBe(true);
  });

  it('createJD with empty content throws (Zod min(1) validation)', async () => {
    const { createJD } = await freshService();
    await expect(createJD({ source: 'paste', content: '' })).rejects.toThrow();
  });

  it('each createJD call generates a unique UUID', async () => {
    const { createJD } = await freshService();
    const a = await createJD({ source: 'paste', content: 'Job A title' });
    const b = await createJD({ source: 'paste', content: 'Job B title' });
    expect(a.jobDescriptionId).not.toBe(b.jobDescriptionId);
  });

  it('newly created JD is retrievable via getJobDescription', async () => {
    const { createJD, getJobDescription } = await freshService();
    const created = await createJD({ source: 'paste', content: 'QA Engineer\n\nDetails here.' });
    const fetched = await getJobDescription(created.jobDescriptionId);
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe('QA Engineer');
  });
});
