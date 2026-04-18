import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));
vi.mock('../../../src/lib/userRepository', () => ({
  upsertUser: vi.fn(),
}));
vi.mock('../../../src/lib/profileRepository', () => ({
  getProfile: vi.fn(),
}));
vi.mock('../../../src/lib/jobDescription/jobDescriptionRepository', () => ({
  getJobDescriptionById: vi.fn(),
}));
vi.mock('../../../src/lib/resumeRepository', () => ({
  createResume: vi.fn(),
}));
vi.mock('../../../src/ai/tailor', () => ({
  tailorResume: vi.fn(),
}));

import { getAuth, getCurrentUser } from '../../../src/lib/auth';
import { upsertUser } from '../../../src/lib/userRepository';
import { getProfile } from '../../../src/lib/profileRepository';
import { getJobDescriptionById } from '../../../src/lib/jobDescription/jobDescriptionRepository';
import { createResume } from '../../../src/lib/resumeRepository';
import { tailorResume } from '../../../src/ai/tailor';
import { profileFixture } from '../../../src/fixtures/index';
import { POST } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockCurrentUser = getCurrentUser as unknown as ReturnType<typeof vi.fn>;
const mockUpsertUser = upsertUser as unknown as ReturnType<typeof vi.fn>;
const mockGetProfile = getProfile as unknown as ReturnType<typeof vi.fn>;
const mockGetJd = getJobDescriptionById as unknown as ReturnType<typeof vi.fn>;
const mockCreateResume = createResume as unknown as ReturnType<typeof vi.fn>;
const mockTailor = tailorResume as unknown as ReturnType<typeof vi.fn>;

const URL = 'http://localhost/api/tailor';

function makeRequest(body: unknown): Request {
  return new Request(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const JD_ID = 'ckjd0000abc1234567890';
const RESUME_ID = 'ckres0000abc1234567890';

const fakeJd = {
  id: JD_ID,
  userId: 'user-1',
  content: 'Engineer at Acme',
  sourceUrl: null,
  title: null,
  company: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeAiResume = {
  resumeId: 'ai-placeholder',
  jobDescriptionId: JD_ID,
  header: '# Jordan',
  summary: '## Summary',
  skills: '## Skills',
  experience: '## Experience',
  education: '## Education',
  projects: '## Projects',
  updatedAt: '2026-04-18T00:00:00.000Z',
};

const savedResume = { ...fakeAiResume, resumeId: RESUME_ID };

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser.mockResolvedValue({ emailAddresses: [{ emailAddress: 'u@x' }] });
  mockUpsertUser.mockResolvedValue(undefined);
});

describe('POST /api/tailor', () => {
  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeRequest({ jobDescriptionId: JD_ID }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body (empty jobDescriptionId)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(makeRequest({ jobDescriptionId: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on malformed JSON', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(
      new Request(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 409 when user has no profile yet', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetProfile.mockResolvedValue(null);
    const res = await POST(makeRequest({ jobDescriptionId: JD_ID }));
    expect(res.status).toBe(409);
  });

  it('returns 404 when JD does not exist OR belongs to another user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetProfile.mockResolvedValue(profileFixture);
    mockGetJd.mockResolvedValue(null);
    const res = await POST(makeRequest({ jobDescriptionId: JD_ID }));
    expect(res.status).toBe(404);
    // The repository must have been queried with the session userId (A01).
    expect(mockGetJd).toHaveBeenCalledWith(JD_ID, 'user-1');
  });

  it('returns 502 when the AI tailor call throws', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetProfile.mockResolvedValue(profileFixture);
    mockGetJd.mockResolvedValue(fakeJd);
    mockTailor.mockRejectedValue(new Error('upstream timeout'));
    const res = await POST(makeRequest({ jobDescriptionId: JD_ID }));
    expect(res.status).toBe(502);
  });

  it('returns 200 with { resumeId, resume } on happy path; AI id overridden by DB id', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetProfile.mockResolvedValue(profileFixture);
    mockGetJd.mockResolvedValue(fakeJd);
    mockTailor.mockResolvedValue(fakeAiResume);
    mockCreateResume.mockResolvedValue(savedResume);

    const res = await POST(makeRequest({ jobDescriptionId: JD_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resumeId).toBe(RESUME_ID);
    expect(body.resume.resumeId).toBe(RESUME_ID);

    expect(mockCreateResume).toHaveBeenCalledWith('user-1', JD_ID, fakeAiResume);
  });
});
