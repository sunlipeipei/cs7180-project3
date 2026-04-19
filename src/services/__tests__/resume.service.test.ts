import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resumesFixture } from '@/fixtures/index';
import { listResumes, getResume, tailorResume, refineSection } from '../resume.service';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mockFetch);
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const FAKE_RESUME = resumesFixture[0];
const JD_ID = FAKE_RESUME.jobDescriptionId;

describe('listResumes', () => {
  it('returns the parsed array on 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { resumes: resumesFixture }));
    const list = await listResumes();
    expect(list).toHaveLength(resumesFixture.length);
  });

  it('returns [] on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, { error: 'none' }));
    const list = await listResumes();
    expect(list).toEqual([]);
  });

  it('throws on 500', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(500, { error: 'boom' }));
    await expect(listResumes()).rejects.toThrow(/500/);
  });
});

describe('getResume', () => {
  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, { error: 'none' }));
    const r = await getResume(FAKE_RESUME.resumeId);
    expect(r).toBeNull();
  });

  it('URL-encodes the id', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, {}));
    await getResume('a/b c');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/resumes/a%2Fb%20c');
  });

  it('returns the parsed resume on 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { resume: FAKE_RESUME }));
    const r = await getResume(FAKE_RESUME.resumeId);
    expect(r?.resumeId).toBe(FAKE_RESUME.resumeId);
  });
});

describe('tailorResume', () => {
  it('throws locally when jobDescriptionId is empty (no request)', async () => {
    await expect(tailorResume({ jobDescriptionId: '' })).rejects.toThrow();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('POSTs JSON to /api/tailor and returns the parsed resume', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { resumeId: 'r1', resume: FAKE_RESUME }));
    const r = await tailorResume({ jobDescriptionId: JD_ID });
    expect(r.resumeId).toBe(FAKE_RESUME.resumeId);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/tailor');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ jobDescriptionId: JD_ID });
  });

  it('surfaces server error on non-ok', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(409, { error: 'Profile required before tailoring' })
    );
    await expect(tailorResume({ jobDescriptionId: JD_ID })).rejects.toThrow(/Profile required/);
  });
});

describe('refineSection', () => {
  it('POSTs to /api/resumes/:id/refine and parses the response', async () => {
    const response = {
      resumeId: FAKE_RESUME.resumeId,
      section: 'summary' as const,
      updatedMarkdown: '## Summary\nNew text.',
      updatedAt: '2026-04-18T00:00:00.000Z',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(200, response));

    const out = await refineSection({
      resumeId: FAKE_RESUME.resumeId,
      section: 'summary',
      instruction: 'Make it shorter.',
    });
    expect(out.updatedMarkdown).toBe(response.updatedMarkdown);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`/api/resumes/${FAKE_RESUME.resumeId}/refine`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      section: 'summary',
      instruction: 'Make it shorter.',
    });
  });
});
