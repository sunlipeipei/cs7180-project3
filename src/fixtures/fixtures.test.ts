import { describe, it, expect } from 'vitest';
import {
  MasterProfileSchema,
  IngestJDResponseSchema,
  TailoredResumeSchema,
} from '../ai/schemas.js';
import { profileFixture } from './profile.fixture.js';
import { jobDescriptionsFixture } from './jobDescriptions.fixture.js';
import { resumesFixture } from './resumes.fixture.js';

describe('profileFixture', () => {
  it('passes MasterProfileSchema validation', () => {
    const result = MasterProfileSchema.safeParse(profileFixture);
    if (!result.success) {
      console.error('MasterProfileSchema errors:', result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('has a non-empty phone', () => {
    expect(profileFixture.phone).toBeTruthy();
    expect(profileFixture.phone.length).toBeGreaterThan(0);
  });

  it('has a non-empty summary', () => {
    expect(profileFixture.summary).toBeTruthy();
    expect(profileFixture.summary!.length).toBeGreaterThan(0);
  });

  it('has links.github', () => {
    expect(profileFixture.links?.github).toBeTruthy();
  });

  it('has links.portfolio', () => {
    expect(profileFixture.links?.portfolio).toBeTruthy();
  });

  it('has at least one education entry', () => {
    expect(profileFixture.education.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least two project entries', () => {
    expect(profileFixture.projects).toBeDefined();
    expect(profileFixture.projects!.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least one certification entry', () => {
    expect(profileFixture.certifications).toBeDefined();
    expect(profileFixture.certifications!.length).toBeGreaterThanOrEqual(1);
  });

  it('has at least 8 skills', () => {
    expect(profileFixture.skills.length).toBeGreaterThanOrEqual(8);
  });

  it('has at least 2 work experience entries', () => {
    expect(profileFixture.workExperience.length).toBeGreaterThanOrEqual(2);
  });

  it('has at least one work experience entry with null endDate (current role)', () => {
    const currentRole = profileFixture.workExperience.find(
      (e) => e.endDate === null || e.endDate === undefined,
    );
    expect(currentRole).toBeDefined();
  });
});

describe('jobDescriptionsFixture', () => {
  it('has exactly 2 entries', () => {
    expect(jobDescriptionsFixture.length).toBe(2);
  });

  it('every entry passes IngestJDResponseSchema validation', () => {
    for (const jd of jobDescriptionsFixture) {
      const result = IngestJDResponseSchema.safeParse(jd);
      if (!result.success) {
        console.error('IngestJDResponseSchema errors:', result.error.format());
      }
      expect(result.success).toBe(true);
    }
  });

  it('all jobDescriptionIds are valid UUIDs', () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const jd of jobDescriptionsFixture) {
      expect(jd.jobDescriptionId).toMatch(uuidRegex);
    }
  });

  it('parsedAt fields are ISO datetime strings', () => {
    for (const jd of jobDescriptionsFixture) {
      expect(() => new Date(jd.parsedAt)).not.toThrow();
      expect(new Date(jd.parsedAt).toISOString()).toBe(jd.parsedAt);
    }
  });
});

describe('resumesFixture', () => {
  it('has exactly 2 entries', () => {
    expect(resumesFixture.length).toBe(2);
  });

  it('every entry passes TailoredResumeSchema validation', () => {
    for (const resume of resumesFixture) {
      const result = TailoredResumeSchema.safeParse(resume);
      if (!result.success) {
        console.error('TailoredResumeSchema errors:', result.error.format());
      }
      expect(result.success).toBe(true);
    }
  });

  it('the tailored resume jobDescriptionId matches jobDescriptionsFixture[0]', () => {
    // resumesFixture[1] is the "tailored" one per spec
    expect(resumesFixture[1].jobDescriptionId).toBe(
      jobDescriptionsFixture[0].jobDescriptionId,
    );
  });

  it('all resumeIds and jobDescriptionIds are valid UUIDs', () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const resume of resumesFixture) {
      expect(resume.resumeId).toMatch(uuidRegex);
      expect(resume.jobDescriptionId).toMatch(uuidRegex);
    }
  });
});

describe('UUID uniqueness across all fixtures', () => {
  it('all IDs are distinct — no accidental duplicates', () => {
    const allIds = [
      ...jobDescriptionsFixture.map((jd) => jd.jobDescriptionId),
      ...resumesFixture.map((r) => r.resumeId),
      ...resumesFixture.map((r) => r.jobDescriptionId),
    ];
    // resumesFixture[1].jobDescriptionId intentionally equals jobDescriptionsFixture[0].jobDescriptionId
    // So we only check that resumeIds don't clash with each other or with JD ids
    const resumeIds = resumesFixture.map((r) => r.resumeId);
    const jdIds = jobDescriptionsFixture.map((jd) => jd.jobDescriptionId);

    // Resume IDs must all be unique
    expect(new Set(resumeIds).size).toBe(resumeIds.length);
    // JD IDs must all be unique
    expect(new Set(jdIds).size).toBe(jdIds.length);
    // No resumeId should match any jdId
    for (const rid of resumeIds) {
      expect(jdIds).not.toContain(rid);
    }
  });
});
