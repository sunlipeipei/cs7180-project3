/**
 * Isolation strategy: each test uses vi.resetModules() + dynamic import so it
 * gets a freshly-seeded module-scoped Map. This prevents cross-test pollution
 * from tailorResume/refineSection mutations persisting between cases.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TailoredResumeSchema, RefineResponseSchema, type ResumeSection } from '@/ai/schemas.js';

async function freshService() {
  vi.resetModules();
  return import('../resume.service.js');
}

const KNOWN_RESUME_ID = 'c3d4e5f6-a7b8-4901-8def-012345678901';
const KNOWN_JD_ID = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789';
const FIXTURE_PROFILE_SNAPSHOT = {
  schemaVersion: 1,
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
  phone: '+1-415-555-0192',
  skills: [],
  workExperience: [],
  education: [],
};

describe('resume.service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // --- listResumes ---

  it('listResumes() returns 2 on cold start (seeded from fixture)', async () => {
    const { listResumes } = await freshService();
    const list = await listResumes();
    expect(list).toHaveLength(2);
  });

  it('listResumes() items all pass TailoredResumeSchema', async () => {
    const { listResumes } = await freshService();
    const list = await listResumes();
    for (const resume of list) {
      expect(TailoredResumeSchema.safeParse(resume).success).toBe(true);
    }
  });

  // --- getResume ---

  it('getResume(knownId) returns the matching resume', async () => {
    const { getResume } = await freshService();
    const resume = await getResume(KNOWN_RESUME_ID);
    expect(resume).not.toBeNull();
    expect(resume?.resumeId).toBe(KNOWN_RESUME_ID);
  });

  it('getResume("nope") returns null', async () => {
    const { getResume } = await freshService();
    const result = await getResume('nope');
    expect(result).toBeNull();
  });

  it('getResume(unknown-uuid) returns null', async () => {
    const { getResume } = await freshService();
    const result = await getResume('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  // --- tailorResume ---

  it('tailorResume returns a valid TailoredResume schema', async () => {
    const { tailorResume } = await freshService();
    const result = await tailorResume({
      jobDescriptionId: KNOWN_JD_ID,
      profileSnapshot: FIXTURE_PROFILE_SNAPSHOT,
    });
    expect(TailoredResumeSchema.safeParse(result).success).toBe(true);
  });

  it('tailorResume links to the provided jobDescriptionId', async () => {
    const { tailorResume } = await freshService();
    const result = await tailorResume({
      jobDescriptionId: KNOWN_JD_ID,
      profileSnapshot: FIXTURE_PROFILE_SNAPSHOT,
    });
    expect(result.jobDescriptionId).toBe(KNOWN_JD_ID);
  });

  it('tailorResume adds a new entry — list length becomes 3', async () => {
    const { listResumes, tailorResume } = await freshService();
    await tailorResume({
      jobDescriptionId: KNOWN_JD_ID,
      profileSnapshot: FIXTURE_PROFILE_SNAPSHOT,
    });
    const list = await listResumes();
    expect(list).toHaveLength(3);
  });

  it('tailored resume is retrievable via getResume', async () => {
    const { getResume, tailorResume } = await freshService();
    const created = await tailorResume({
      jobDescriptionId: KNOWN_JD_ID,
      profileSnapshot: FIXTURE_PROFILE_SNAPSHOT,
    });
    const fetched = await getResume(created.resumeId);
    expect(fetched).not.toBeNull();
    expect(fetched?.resumeId).toBe(created.resumeId);
  });

  it('each tailorResume call generates a unique resumeId', async () => {
    const { tailorResume } = await freshService();
    const a = await tailorResume({ jobDescriptionId: KNOWN_JD_ID, profileSnapshot: FIXTURE_PROFILE_SNAPSHOT });
    const b = await tailorResume({ jobDescriptionId: KNOWN_JD_ID, profileSnapshot: FIXTURE_PROFILE_SNAPSHOT });
    expect(a.resumeId).not.toBe(b.resumeId);
  });

  it('tailorResume produces placeholder content in all sections', async () => {
    const { tailorResume } = await freshService();
    const result = await tailorResume({
      jobDescriptionId: KNOWN_JD_ID,
      profileSnapshot: FIXTURE_PROFILE_SNAPSHOT,
    });
    // All sections should be non-empty strings (Phase 0.5 placeholder)
    expect(result.header.length).toBeGreaterThan(0);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.experience.length).toBeGreaterThan(0);
    expect(result.education.length).toBeGreaterThan(0);
    expect(result.projects.length).toBeGreaterThan(0);
  });

  it('tailorResume with invalid jobDescriptionId (not uuid) throws', async () => {
    const { tailorResume } = await freshService();
    await expect(
      tailorResume({ jobDescriptionId: 'not-a-uuid', profileSnapshot: FIXTURE_PROFILE_SNAPSHOT }),
    ).rejects.toThrow();
  });

  // --- refineSection ---

  it('refineSection on a known resume returns a valid RefineResponse', async () => {
    const { refineSection } = await freshService();
    const result = await refineSection({
      resumeId: KNOWN_RESUME_ID,
      section: 'summary',
      instruction: 'Make it more concise',
    });
    expect(RefineResponseSchema.safeParse(result).success).toBe(true);
  });

  it('refineSection returns resumeId and section matching the request', async () => {
    const { refineSection } = await freshService();
    const result = await refineSection({
      resumeId: KNOWN_RESUME_ID,
      section: 'skills',
      instruction: 'Emphasize cloud skills',
    });
    expect(result.resumeId).toBe(KNOWN_RESUME_ID);
    expect(result.section).toBe('skills');
  });

  it('refineSection appends the instruction to the section markdown', async () => {
    const { refineSection } = await freshService();
    const result = await refineSection({
      resumeId: KNOWN_RESUME_ID,
      section: 'summary',
      instruction: 'Be more impactful',
    });
    expect(result.updatedMarkdown).toContain('Refined: Be more impactful');
  });

  it('refineSection persists — getResume returns updated section', async () => {
    const { refineSection, getResume } = await freshService();
    await refineSection({
      resumeId: KNOWN_RESUME_ID,
      section: 'summary',
      instruction: 'Use stronger verbs',
    });
    const resume = await getResume(KNOWN_RESUME_ID);
    expect(resume?.summary).toContain('Refined: Use stronger verbs');
  });

  it('refineSection updates updatedAt to a more recent timestamp', async () => {
    const { getResume, refineSection } = await freshService();
    const before = await getResume(KNOWN_RESUME_ID);
    const originalUpdatedAt = before!.updatedAt;

    // Ensure some time passes
    await new Promise((r) => setTimeout(r, 10));

    const result = await refineSection({
      resumeId: KNOWN_RESUME_ID,
      section: 'experience',
      instruction: 'Add metrics',
    });

    expect(result.updatedAt > originalUpdatedAt).toBe(true);
  });

  it('refineSection on unknown resumeId throws', async () => {
    const { refineSection } = await freshService();
    await expect(
      refineSection({
        resumeId: '00000000-0000-0000-0000-000000000000',
        section: 'summary',
        instruction: 'Fix it',
      }),
    ).rejects.toThrow();
  });

  it('refineSection on non-uuid resumeId throws (Zod validation)', async () => {
    const { refineSection } = await freshService();
    await expect(
      refineSection({ resumeId: 'not-a-uuid', section: 'summary', instruction: 'Fix it' }),
    ).rejects.toThrow();
  });

  it('refineSection with empty instruction throws (Zod min(1) validation)', async () => {
    const { refineSection } = await freshService();
    await expect(
      refineSection({ resumeId: KNOWN_RESUME_ID, section: 'summary', instruction: '' }),
    ).rejects.toThrow();
  });

  it('refineSection with instruction over 1000 chars throws (Zod max(1000))', async () => {
    const { refineSection } = await freshService();
    await expect(
      refineSection({ resumeId: KNOWN_RESUME_ID, section: 'summary', instruction: 'x'.repeat(1001) }),
    ).rejects.toThrow();
  });

  it('refineSection on invalid section name throws', async () => {
    const { refineSection } = await freshService();
    await expect(
      refineSection({
        resumeId: KNOWN_RESUME_ID,
        section: 'invalid_section' as unknown as ResumeSection,
        instruction: 'Fix it',
      }),
    ).rejects.toThrow();
  });
});
