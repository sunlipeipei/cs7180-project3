import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('../../../../src/lib/jobDescription/jobDescriptionRepository', () => ({
  getJobDescriptionById: vi.fn(),
}));

import { getAuth } from '../../../../src/lib/auth';
import { getJobDescriptionById } from '../../../../src/lib/jobDescription/jobDescriptionRepository';
import { GET } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockGet = getJobDescriptionById as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

const JD_ID = 'ckjd1234567890abcdef';

function paramsFor(id: string): { params: Promise<{ jdId: string }> } {
  return { params: Promise.resolve({ jdId: id }) };
}

describe('GET /api/job-descriptions/[jdId]', () => {
  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(
      new Request(`http://localhost/api/job-descriptions/${JD_ID}`),
      paramsFor(JD_ID)
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 when repo returns null (cross-user or missing)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(null);
    const res = await GET(
      new Request(`http://localhost/api/job-descriptions/${JD_ID}`),
      paramsFor(JD_ID)
    );
    expect(res.status).toBe(404);
    expect(mockGet).toHaveBeenCalledWith(JD_ID, 'user-1');
  });

  it('returns 200 with the raw JD row on hit', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue({
      id: JD_ID,
      userId: 'user-1',
      content: 'Engineer at Acme',
      sourceUrl: null,
      title: 'Engineer',
      company: 'Acme',
      createdAt: new Date('2026-04-18T00:00:00.000Z'),
      updatedAt: new Date('2026-04-18T00:00:00.000Z'),
    });
    const res = await GET(
      new Request(`http://localhost/api/job-descriptions/${JD_ID}`),
      paramsFor(JD_ID)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(JD_ID);
  });
});
