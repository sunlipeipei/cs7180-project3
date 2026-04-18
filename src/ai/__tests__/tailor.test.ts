import { describe, it, expect, vi, beforeEach } from 'vitest';

// The client must be mocked BEFORE `tailor.ts` is imported. We mock the
// factory so getClient() returns a fake with the single method we use.
const parseMock = vi.fn();

vi.mock('../client', () => ({
  getClient: () => ({
    chat: {
      completions: {
        parse: parseMock,
      },
    },
  }),
  getModel: () => 'openai/gpt-5.1-test',
}));

import { tailorResume } from '../tailor';
import { TailoredResumeSchema } from '../schemas';
import { profileFixture } from '../../fixtures/index';

const JD_ID = 'ckjd0000abc1234567890';
const FAKE_RESUME = {
  resumeId: 'ckres0000abc1234567890',
  jobDescriptionId: JD_ID,
  header: '# Jordan Lee',
  summary: '## Summary\nTailored summary.',
  skills: '## Skills\nTypeScript, React.',
  experience: '## Experience\nBuilt things.',
  education: '## Education\nState University.',
  projects: '## Projects\nMyProject.',
  updatedAt: '2026-04-18T00:00:00.000Z',
};

function fakeCompletion(parsed: unknown) {
  return {
    choices: [{ message: { parsed } }],
    usage: { prompt_tokens: 1200, completion_tokens: 800 },
  };
}

const jd = {
  id: JD_ID,
  content: 'We are hiring a Senior Software Engineer at Acme Corp to build...',
};

beforeEach(() => {
  parseMock.mockReset();
});

describe('tailorResume', () => {
  it('returns a Zod-validated TailoredResume on success', async () => {
    parseMock.mockResolvedValueOnce(fakeCompletion(FAKE_RESUME));
    const out = await tailorResume(profileFixture, jd);
    expect(TailoredResumeSchema.safeParse(out).success).toBe(true);
    expect(out.resumeId).toBe(FAKE_RESUME.resumeId);
  });

  it('wraps the JD text in <job_description> delimiters (A03 prompt injection)', async () => {
    parseMock.mockResolvedValueOnce(fakeCompletion(FAKE_RESUME));
    await tailorResume(profileFixture, jd);

    const callArg = parseMock.mock.calls[0][0];
    const allMessageText = callArg.messages
      .map((m: { content: string }) => m.content)
      .join('\n');
    expect(allMessageText).toContain('<job_description>');
    expect(allMessageText).toContain(jd.content);
    expect(allMessageText).toContain('</job_description>');
  });

  it('passes response_format set to the TailoredResume schema', async () => {
    parseMock.mockResolvedValueOnce(fakeCompletion(FAKE_RESUME));
    await tailorResume(profileFixture, jd);

    const callArg = parseMock.mock.calls[0][0];
    expect(callArg.response_format).toBeDefined();
    expect(callArg.response_format.type).toBe('json_schema');
  });

  it('throws when the model returns a null/missing parsed payload on both attempts', async () => {
    parseMock.mockResolvedValue(fakeCompletion(null));
    await expect(tailorResume(profileFixture, jd)).rejects.toThrow(/parsed/i);
  });

  it('retries once when the first response fails Zod validation, appending the error', async () => {
    // First call returns a payload that will fail the schema (missing required
    // markdown sections); second call returns the valid resume.
    parseMock.mockResolvedValueOnce(
      fakeCompletion({ ...FAKE_RESUME, summary: undefined })
    );
    parseMock.mockResolvedValueOnce(fakeCompletion(FAKE_RESUME));

    const out = await tailorResume(profileFixture, jd);
    expect(out.resumeId).toBe(FAKE_RESUME.resumeId);
    expect(parseMock).toHaveBeenCalledTimes(2);

    // The retry should include the validation error as additional context.
    const retryArg = parseMock.mock.calls[1][0];
    const retryText = retryArg.messages.map((m: { content: string }) => m.content).join('\n');
    expect(retryText.toLowerCase()).toMatch(/error|invalid|validation|previous/);
  });

  it('throws on second consecutive Zod failure', async () => {
    parseMock.mockResolvedValue(fakeCompletion({ ...FAKE_RESUME, summary: undefined }));
    await expect(tailorResume(profileFixture, jd)).rejects.toThrow();
    expect(parseMock).toHaveBeenCalledTimes(2);
  });
});
