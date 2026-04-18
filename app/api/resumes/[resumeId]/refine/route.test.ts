import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('../../../../../src/lib/resumeRepository', () => ({
  getResume: vi.fn(),
  updateResume: vi.fn(),
}));
vi.mock('../../../../../src/ai/refine', () => ({
  refineResumeSection: vi.fn(),
}));

import { getAuth } from '../../../../../src/lib/auth';
import { getResume, updateResume } from '../../../../../src/lib/resumeRepository';
import { refineResumeSection } from '../../../../../src/ai/refine';
import { resumesFixture } from '../../../../../src/fixtures/index';
import { POST } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockGet = getResume as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = updateResume as unknown as ReturnType<typeof vi.fn>;
const mockRefine = refineResumeSection as unknown as ReturnType<typeof vi.fn>;

const RESUME = resumesFixture[0];
const URL = `http://localhost/api/resumes/${RESUME.resumeId}/refine`;

function paramsFor(id: string): { params: Promise<{ resumeId: string }> } {
  return { params: Promise.resolve({ resumeId: id }) };
}

function makeRequest(body: unknown): Request {
  return new Request(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/resumes/[resumeId]/refine', () => {
  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(
      makeRequest({ section: 'summary', instruction: 'Fix' }),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 on malformed JSON', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const req = new Request(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req, paramsFor(RESUME.resumeId));
    expect(res.status).toBe(400);
  });

  it('returns 400 when section is invalid', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(
      makeRequest({ section: 'references', instruction: 'Fix' }),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when instruction is empty', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(
      makeRequest({ section: 'summary', instruction: '' }),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when instruction exceeds 1000 chars', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(
      makeRequest({ section: 'summary', instruction: 'a'.repeat(1001) }),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when resume not found (cross-user or missing)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(null);
    const res = await POST(
      makeRequest({ section: 'summary', instruction: 'Fix' }),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(404);
    expect(mockGet).toHaveBeenCalledWith(RESUME.resumeId, 'user-1');
  });

  it('returns 502 on AI refine failure', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(RESUME);
    mockRefine.mockRejectedValue(new Error('upstream timeout'));
    const res = await POST(
      makeRequest({ section: 'summary', instruction: 'Tighten' }),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(502);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 200 with the new section markdown and persists via updateResume', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(RESUME);
    mockRefine.mockResolvedValue('## Summary\nShorter, sharper.');
    mockUpdate.mockResolvedValue({
      ...RESUME,
      summary: '## Summary\nShorter, sharper.',
      updatedAt: '2026-04-18T12:00:00.000Z',
    });

    const res = await POST(
      makeRequest({ section: 'summary', instruction: 'Tighten' }),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.section).toBe('summary');
    expect(body.updatedMarkdown).toBe('## Summary\nShorter, sharper.');
    expect(body.updatedAt).toBe('2026-04-18T12:00:00.000Z');

    // updateResume must receive the session userId and the merged resume.
    const [calledId, calledUserId, mergedResume] = mockUpdate.mock.calls[0];
    expect(calledId).toBe(RESUME.resumeId);
    expect(calledUserId).toBe('user-1');
    expect(mergedResume.summary).toBe('## Summary\nShorter, sharper.');
    // Other sections are byte-identical to the stored resume.
    expect(mergedResume.skills).toBe(RESUME.skills);
    expect(mergedResume.experience).toBe(RESUME.experience);
  });
});
