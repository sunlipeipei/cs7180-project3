import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('../../../../src/lib/resumeRepository', () => ({
  getResume: vi.fn(),
}));

import { getAuth } from '../../../../src/lib/auth';
import { getResume } from '../../../../src/lib/resumeRepository';
import { resumesFixture } from '../../../../src/fixtures/index';
import { GET } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockGet = getResume as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

const RESUME_ID = resumesFixture[0].resumeId;

function paramsFor(id: string): { params: Promise<{ resumeId: string }> } {
  return { params: Promise.resolve({ resumeId: id }) };
}

describe('GET /api/resumes/[resumeId]', () => {
  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(
      new Request(`http://localhost/api/resumes/${RESUME_ID}`),
      paramsFor(RESUME_ID)
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 when repo returns null (cross-user or missing)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(null);
    const res = await GET(
      new Request(`http://localhost/api/resumes/${RESUME_ID}`),
      paramsFor(RESUME_ID)
    );
    expect(res.status).toBe(404);
    // Repository must receive the session userId so cross-user access is blocked.
    expect(mockGet).toHaveBeenCalledWith(RESUME_ID, 'user-1');
  });

  it('returns 200 with the resume body on hit', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(resumesFixture[0]);
    const res = await GET(
      new Request(`http://localhost/api/resumes/${RESUME_ID}`),
      paramsFor(RESUME_ID)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resume.resumeId).toBe(RESUME_ID);
  });
});
