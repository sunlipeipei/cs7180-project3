import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => {
  const parse = vi.fn();
  const client = { chat: { completions: { parse } } };
  return {
    getClient: vi.fn(() => client),
    getModel: vi.fn(() => 'test-model'),
    __parseMock: parse,
    __resetClientForTests: vi.fn(),
  };
});

// Reach into the mock to drive the response from each test.
import * as clientModule from './client';
import { ingestProfileFromText } from './ingestProfile';

const parseMock = (clientModule as unknown as { __parseMock: ReturnType<typeof vi.fn> })
  .__parseMock;

function makeCompletion(parsed: unknown) {
  return {
    choices: [{ message: { parsed } }],
    usage: { prompt_tokens: 10, completion_tokens: 20 },
  };
}

beforeEach(() => {
  parseMock.mockReset();
});

describe('ingestProfileFromText', () => {
  it('resolves to a MasterProfile when the model returns an LLM-shaped payload with null optionals', async () => {
    const llmShaped = {
      schemaVersion: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1-555-0100',
      summary: null,
      address: {
        street: null,
        city: 'San Francisco',
        state: null,
        zip: null,
        country: 'US',
      },
      links: { github: null, linkedin: null, portfolio: null, other: null },
      skills: [{ name: 'TypeScript', category: null, level: null }],
      workExperience: [
        {
          company: 'Acme Corp',
          title: 'Software Engineer',
          startDate: '2021-06-01',
          endDate: null,
          location: null,
          descriptions: ['Built scalable APIs'],
        },
      ],
      education: [
        {
          school: 'State U',
          degree: 'B.S. CS',
          fieldOfStudy: null,
          startDate: null,
          endDate: null,
          gpa: null,
        },
      ],
      projects: null,
      certifications: null,
      resumeTemplatePath: null,
      contextSources: null,
      preferences: null,
    };
    parseMock.mockResolvedValueOnce(makeCompletion(llmShaped));

    const profile = await ingestProfileFromText('resume text');

    expect(profile.name).toBe('Jane Doe');
    expect(profile.skills[0]?.category).toBeNull();
    expect(profile.address?.street).toBeNull();
  });

  it('throws a typed error when the model returns no parsed payload', async () => {
    parseMock.mockResolvedValueOnce({
      choices: [{ message: { parsed: null } }],
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    });

    await expect(ingestProfileFromText('anything')).rejects.toThrow(
      /no parsed profile/i
    );
  });

  it('surfaces Zod validation errors for genuinely invalid profiles (e.g. missing name)', async () => {
    const invalid = { schemaVersion: 1, email: 'a@b.co', phone: '+1', skills: [], workExperience: [], education: [] };
    parseMock.mockResolvedValueOnce(makeCompletion(invalid));
    await expect(ingestProfileFromText('anything')).rejects.toThrow();
  });
});
