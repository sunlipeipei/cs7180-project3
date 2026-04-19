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
  saveProfile: vi.fn(),
}));

import { getAuth, getCurrentUser } from '../../../src/lib/auth';
import { upsertUser } from '../../../src/lib/userRepository';
import { getProfile, saveProfile } from '../../../src/lib/profileRepository';
import { profileFixture } from '../../../src/fixtures/index';
import { GET, PUT } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockCurrentUser = getCurrentUser as unknown as ReturnType<typeof vi.fn>;
const mockUpsertUser = upsertUser as unknown as ReturnType<typeof vi.fn>;
const mockGetProfile = getProfile as unknown as ReturnType<typeof vi.fn>;
const mockSaveProfile = saveProfile as unknown as ReturnType<typeof vi.fn>;

const URL = 'http://localhost/api/profile';

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser.mockResolvedValue({
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  });
  mockUpsertUser.mockResolvedValue(undefined);
});

describe('GET /api/profile', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(new Request(URL, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when profile does not exist', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetProfile.mockResolvedValue(null);
    const res = await GET(new Request(URL, { method: 'GET' }));
    expect(res.status).toBe(404);
  });

  it('returns 200 with profile', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetProfile.mockResolvedValue(profileFixture);
    const res = await GET(new Request(URL, { method: 'GET' }));
    expect(res.status).toBe(200);
    expect(mockGetProfile).toHaveBeenCalledWith('user-1');
    expect((await res.json()).profile.name).toBe(profileFixture.name);
  });
});

describe('PUT /api/profile', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await PUT(
      new Request(URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileFixture),
      })
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is not valid JSON', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await PUT(
      new Request(URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when Zod validation fails', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await PUT(
      new Request(URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ not: 'a profile' }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 on happy path and scopes save to session userId', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockSaveProfile.mockResolvedValue(undefined);
    const res = await PUT(
      new Request(URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileFixture),
      })
    );
    expect(res.status).toBe(200);
    expect(mockSaveProfile).toHaveBeenCalledWith('user-1', expect.any(Object));
  });
});
