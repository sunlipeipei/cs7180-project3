import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('../../../src/lib/resumeRepository', () => ({
  listResumes: vi.fn(),
}));

import { getAuth } from '../../../src/lib/auth';
import { listResumes } from '../../../src/lib/resumeRepository';
import { resumesFixture } from '../../../src/fixtures/index';
import { GET } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockList = listResumes as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('GET /api/resumes', () => {
  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(new Request('http://localhost/api/resumes'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with the user scoped list', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockList.mockResolvedValue(resumesFixture);
    const res = await GET(new Request('http://localhost/api/resumes'));
    expect(res.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith('user-1');
    const body = await res.json();
    expect(Array.isArray(body.resumes)).toBe(true);
  });

  it('returns 500 when the repository throws', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockList.mockRejectedValue(new Error('db down'));
    const res = await GET(new Request('http://localhost/api/resumes'));
    expect(res.status).toBe(500);
  });
});
