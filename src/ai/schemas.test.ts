import { describe, it, expect } from 'vitest';
import {
  MasterProfileSchema,
  TailoredResumeSchema,
  IngestJDRequestSchema,
  IngestJDResponseSchema,
  TailorRequestSchema,
  TailorResponseSchema,
  RefineRequestSchema,
  RefineResponseSchema,
  ResumeSectionEnum,
  type MasterProfile,
  type TailoredResume,
  type IngestJDRequest,
  type IngestJDResponse,
  type TailorRequest,
  type TailorResponse,
  type RefineRequest,
  type RefineResponse,
} from './schemas.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validMasterProfile: MasterProfile = {
  schemaVersion: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1-555-0100',
  skills: [{ name: 'TypeScript', category: 'Languages' }],
  workExperience: [
    {
      company: 'Acme Corp',
      title: 'Software Engineer',
      startDate: '2021-06-01',
      descriptions: ['Built scalable APIs'],
    },
  ],
  education: [
    {
      school: 'State University',
      degree: 'B.S. Computer Science',
    },
  ],
};

const validTailoredResume: TailoredResume = {
  resumeId: '00000000-0000-4000-a000-000000000001',
  jobDescriptionId: '00000000-0000-4000-a000-000000000002',
  header: '# Jane Doe\njane@example.com | +1-555-0100',
  summary: 'Experienced engineer with a focus on backend systems.',
  skills: '- TypeScript\n- Node.js',
  experience: '## Acme Corp\n- Built scalable APIs',
  education: '## State University\nB.S. Computer Science',
  projects: '## Open Source CLI\nRust-based tool',
  updatedAt: '2024-01-15T10:30:00.000Z',
};

// ---------------------------------------------------------------------------
// MasterProfileSchema (re-export)
// ---------------------------------------------------------------------------

describe('MasterProfileSchema', () => {
  it('parses a valid master profile', () => {
    const result = MasterProfileSchema.safeParse(validMasterProfile);
    expect(result.success).toBe(true);
  });

  it('rejects a profile missing required name', () => {
    const { name: _name, ...rest } = validMasterProfile;
    const result = MasterProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email format', () => {
    const result = MasterProfileSchema.safeParse({
      ...validMasterProfile,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a profile missing workExperience array', () => {
    const { workExperience: _we, ...rest } = validMasterProfile;
    const result = MasterProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts optional fields being absent', () => {
    const result = MasterProfileSchema.safeParse(validMasterProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address).toBeUndefined();
      expect(result.data.links).toBeUndefined();
    }
  });

  // Compile-time check — fails tsc if inference breaks
  type _MasterProfileCheck = MasterProfile extends { name: string; email: string } ? true : never;
});

// ---------------------------------------------------------------------------
// TailoredResumeSchema
// ---------------------------------------------------------------------------

describe('TailoredResumeSchema', () => {
  it('parses a valid tailored resume', () => {
    const result = TailoredResumeSchema.safeParse(validTailoredResume);
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID resumeId', () => {
    const result = TailoredResumeSchema.safeParse({
      ...validTailoredResume,
      resumeId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-UUID jobDescriptionId', () => {
    const result = TailoredResumeSchema.safeParse({
      ...validTailoredResume,
      jobDescriptionId: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid datetime in updatedAt', () => {
    const result = TailoredResumeSchema.safeParse({
      ...validTailoredResume,
      updatedAt: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required section fields', () => {
    const { header: _h, ...rest } = validTailoredResume;
    const result = TailoredResumeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a missing summary field', () => {
    const { summary: _s, ...rest } = validTailoredResume;
    const result = TailoredResumeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // Compile-time check
  type _TailoredResumeCheck = TailoredResume extends { resumeId: string; header: string }
    ? true
    : never;
});

// ---------------------------------------------------------------------------
// ResumeSectionEnum
// ---------------------------------------------------------------------------

describe('ResumeSectionEnum', () => {
  const validSections = ['header', 'summary', 'skills', 'experience', 'education', 'projects'];

  it.each(validSections)('accepts section "%s"', (section) => {
    expect(ResumeSectionEnum.safeParse(section).success).toBe(true);
  });

  it('rejects an unknown section', () => {
    expect(ResumeSectionEnum.safeParse('certifications').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(ResumeSectionEnum.safeParse('').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// IngestJDRequestSchema / IngestJDResponseSchema
// ---------------------------------------------------------------------------

describe('IngestJDRequestSchema', () => {
  it('parses a url source request', () => {
    const result = IngestJDRequestSchema.safeParse({
      source: 'url',
      content: 'https://jobs.example.com/123',
    });
    expect(result.success).toBe(true);
  });

  it('parses a paste source request', () => {
    const result = IngestJDRequestSchema.safeParse({
      source: 'paste',
      content: 'We are looking for a senior engineer...',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown source value', () => {
    const result = IngestJDRequestSchema.safeParse({
      source: 'file',
      content: 'some content',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty content', () => {
    const result = IngestJDRequestSchema.safeParse({
      source: 'paste',
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content field', () => {
    const result = IngestJDRequestSchema.safeParse({ source: 'url' });
    expect(result.success).toBe(false);
  });

  it('rejects missing source field', () => {
    const result = IngestJDRequestSchema.safeParse({ content: 'some text' });
    expect(result.success).toBe(false);
  });

  // Compile-time check
  type _IngestJDRequestCheck = IngestJDRequest extends { source: 'url' | 'paste' } ? true : never;
});

describe('IngestJDResponseSchema', () => {
  const validResponse: IngestJDResponse = {
    jobDescriptionId: '00000000-0000-4000-a000-000000000003',
    title: 'Senior Software Engineer',
    company: 'Acme Corp',
    parsedAt: '2024-01-15T10:30:00.000Z',
  };

  it('parses a valid ingest response', () => {
    expect(IngestJDResponseSchema.safeParse(validResponse).success).toBe(true);
  });

  it('rejects a non-UUID jobDescriptionId', () => {
    const result = IngestJDResponseSchema.safeParse({
      ...validResponse,
      jobDescriptionId: 'bad-id',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid parsedAt datetime', () => {
    const result = IngestJDResponseSchema.safeParse({
      ...validResponse,
      parsedAt: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const { title: _t, ...rest } = validResponse;
    const result = IngestJDResponseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // Compile-time check
  type _IngestJDResponseCheck = IngestJDResponse extends { jobDescriptionId: string }
    ? true
    : never;
});

// ---------------------------------------------------------------------------
// TailorRequestSchema / TailorResponseSchema
// ---------------------------------------------------------------------------

describe('TailorRequestSchema', () => {
  const validRequest: TailorRequest = {
    jobDescriptionId: '00000000-0000-4000-a000-000000000002',
    profileSnapshot: validMasterProfile,
  };

  it('parses a valid tailor request', () => {
    expect(TailorRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('rejects a non-UUID jobDescriptionId', () => {
    const result = TailorRequestSchema.safeParse({
      ...validRequest,
      jobDescriptionId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid profileSnapshot (bad email)', () => {
    const result = TailorRequestSchema.safeParse({
      ...validRequest,
      profileSnapshot: { ...validMasterProfile, email: 'bad' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing profileSnapshot', () => {
    const result = TailorRequestSchema.safeParse({
      jobDescriptionId: '00000000-0000-4000-a000-000000000002',
    });
    expect(result.success).toBe(false);
  });

  // Compile-time check
  type _TailorRequestCheck = TailorRequest extends { jobDescriptionId: string } ? true : never;
});

describe('TailorResponseSchema', () => {
  it('parses a valid tailor response (same shape as TailoredResume)', () => {
    expect(TailorResponseSchema.safeParse(validTailoredResume).success).toBe(true);
  });

  it('rejects a non-UUID resumeId in response', () => {
    const result = TailorResponseSchema.safeParse({
      ...validTailoredResume,
      resumeId: 'bad',
    });
    expect(result.success).toBe(false);
  });

  // Compile-time check
  type _TailorResponseCheck = TailorResponse extends { resumeId: string } ? true : never;
});

// ---------------------------------------------------------------------------
// RefineRequestSchema / RefineResponseSchema
// ---------------------------------------------------------------------------

describe('RefineRequestSchema', () => {
  it('parses a valid refine request', () => {
    const result = RefineRequestSchema.safeParse({
      resumeId: '00000000-0000-4000-a000-000000000001',
      section: 'summary',
      instruction: 'Make it more concise.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID resumeId', () => {
    const result = RefineRequestSchema.safeParse({
      resumeId: 'bad-id',
      section: 'summary',
      instruction: 'Make it more concise.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid section value', () => {
    const result = RefineRequestSchema.safeParse({
      resumeId: '00000000-0000-4000-a000-000000000001',
      section: 'references',
      instruction: 'Make it more concise.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty instruction', () => {
    const result = RefineRequestSchema.safeParse({
      resumeId: '00000000-0000-4000-a000-000000000001',
      section: 'skills',
      instruction: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an instruction exceeding 1000 characters', () => {
    const result = RefineRequestSchema.safeParse({
      resumeId: '00000000-0000-4000-a000-000000000001',
      section: 'skills',
      instruction: 'a'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts an instruction at exactly 1000 characters', () => {
    const result = RefineRequestSchema.safeParse({
      resumeId: '00000000-0000-4000-a000-000000000001',
      section: 'experience',
      instruction: 'a'.repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing section field', () => {
    const result = RefineRequestSchema.safeParse({
      resumeId: '00000000-0000-4000-a000-000000000001',
      instruction: 'Improve this.',
    });
    expect(result.success).toBe(false);
  });

  // Compile-time check
  type _RefineRequestCheck = RefineRequest extends { resumeId: string; section: string }
    ? true
    : never;
});

describe('RefineResponseSchema', () => {
  const validRefineResponse: RefineResponse = {
    resumeId: '00000000-0000-4000-a000-000000000001',
    section: 'summary',
    updatedMarkdown: '## Summary\nExperienced engineer.',
    updatedAt: '2024-01-15T10:30:00.000Z',
  };

  it('parses a valid refine response', () => {
    expect(RefineResponseSchema.safeParse(validRefineResponse).success).toBe(true);
  });

  it('rejects a non-UUID resumeId', () => {
    const result = RefineResponseSchema.safeParse({
      ...validRefineResponse,
      resumeId: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid section in response', () => {
    const result = RefineResponseSchema.safeParse({
      ...validRefineResponse,
      section: 'references',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid updatedAt datetime', () => {
    const result = RefineResponseSchema.safeParse({
      ...validRefineResponse,
      updatedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing updatedMarkdown', () => {
    const { updatedMarkdown: _um, ...rest } = validRefineResponse;
    const result = RefineResponseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  // Compile-time check
  type _RefineResponseCheck = RefineResponse extends { section: string; updatedMarkdown: string }
    ? true
    : never;
});
