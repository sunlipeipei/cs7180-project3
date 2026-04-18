import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { refineResumeSection } from '../refine';
import type { TailoredResume, ResumeSection } from '../schemas';

const BASE_RESUME: TailoredResume = {
  resumeId: 'ckres0000abc',
  jobDescriptionId: 'ckjd0000abc',
  header: '# Jordan Lee',
  summary: '## Summary\nOriginal summary text.',
  skills: '## Skills\nTypeScript, React.',
  experience: '## Experience\nSenior Engineer at Acme.',
  education: '## Education\nB.S. State University.',
  projects: '## Projects\nMyProject.',
  updatedAt: '2026-04-18T00:00:00.000Z',
};

function fakeCompletion(markdown: string) {
  return {
    choices: [{ message: { parsed: { updatedMarkdown: markdown } } }],
    usage: { prompt_tokens: 300, completion_tokens: 120 },
  };
}

beforeEach(() => {
  parseMock.mockReset();
});

describe('refineResumeSection', () => {
  it('returns only the rewritten markdown for the requested section', async () => {
    parseMock.mockResolvedValueOnce(fakeCompletion('## Summary\nTighter, punchier version.'));
    const out = await refineResumeSection(BASE_RESUME, 'summary', 'Make it more concise');
    expect(out).toBe('## Summary\nTighter, punchier version.');
  });

  it('wraps the user instruction in <user_instruction> delimiters (A03)', async () => {
    parseMock.mockResolvedValueOnce(fakeCompletion('## Summary\nUpdated.'));
    await refineResumeSection(BASE_RESUME, 'summary', 'Drop the buzzwords');

    const callArg = parseMock.mock.calls[0][0];
    const text = callArg.messages.map((m: { content: string }) => m.content).join('\n');
    expect(text).toContain('<user_instruction>');
    expect(text).toContain('Drop the buzzwords');
    expect(text).toContain('</user_instruction>');
  });

  it('only sends the requested section and the JD id to the model — not the other sections', async () => {
    // This is the behavioral guarantee equivalent to "byte-identical
    // untouched sections": the model never sees the other sections, so
    // it cannot rewrite them even if it wanted to.
    parseMock.mockResolvedValueOnce(fakeCompletion('## Skills\nUpdated skill list.'));
    await refineResumeSection(BASE_RESUME, 'skills', 'Emphasize cloud skills');

    const callArg = parseMock.mock.calls[0][0];
    const text = callArg.messages.map((m: { content: string }) => m.content).join('\n');

    // The target section's markdown IS sent (so the model can rewrite it).
    expect(text).toContain(BASE_RESUME.skills);
    // No other section content may appear in the prompt.
    expect(text).not.toContain(BASE_RESUME.summary);
    expect(text).not.toContain(BASE_RESUME.experience);
    expect(text).not.toContain(BASE_RESUME.education);
    expect(text).not.toContain(BASE_RESUME.projects);
    expect(text).not.toContain(BASE_RESUME.header);
  });

  it('throws when the response has no parsed markdown', async () => {
    parseMock.mockResolvedValue({
      choices: [{ message: { parsed: null } }],
      usage: {},
    });
    await expect(refineResumeSection(BASE_RESUME, 'summary', 'Tighten')).rejects.toThrow(/parsed/i);
  });

  it('retries once when the first response has an empty updatedMarkdown', async () => {
    parseMock.mockResolvedValueOnce(fakeCompletion(''));
    parseMock.mockResolvedValueOnce(fakeCompletion('## Summary\nRecovered.'));
    const out = await refineResumeSection(BASE_RESUME, 'summary', 'Fix');
    expect(out).toBe('## Summary\nRecovered.');
    expect(parseMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    'header',
    'summary',
    'skills',
    'experience',
    'education',
    'projects',
  ] as ResumeSection[])('works for every enum section (%s)', async (section) => {
    parseMock.mockResolvedValueOnce(fakeCompletion(`${section} rewritten`));
    const out = await refineResumeSection(BASE_RESUME, section, 'Rewrite');
    expect(out).toBe(`${section} rewritten`);
  });
});
