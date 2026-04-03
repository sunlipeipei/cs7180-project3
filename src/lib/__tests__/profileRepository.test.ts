import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfile, saveProfile } from '../profileRepository';
import { ProfileValidationError } from '../../profile/errors';
import type { MasterProfile } from '../../profile/types';

// Mock the Prisma singleton so tests never hit a real DB
vi.mock('../prisma', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Import after mock so we get the mocked version
import { prisma } from '../prisma';

const mockFindUnique = vi.mocked(prisma.profile.findUnique);
const mockUpsert = vi.mocked(prisma.profile.upsert);

const validProfile: MasterProfile = {
  schemaVersion: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1-555-000-0000',
  skills: [{ name: 'TypeScript' }],
  workExperience: [],
  education: [],
};

describe('getProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no profile record exists', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await getProfile('user-123');

    expect(result).toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
  });

  it('returns parsed MasterProfile when record exists', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-123',
      data: validProfile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getProfile('user-123');

    expect(result).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
  });

  it('throws ProfileValidationError when stored data is invalid', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-123',
      data: { name: 'No Email' }, // missing required fields
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(getProfile('user-123')).rejects.toThrow(ProfileValidationError);
  });
});

describe('saveProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({} as never);
  });

  it('upserts the profile for the given userId', async () => {
    await saveProfile('user-123', validProfile);

    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      create: { userId: 'user-123', data: expect.objectContaining({ name: 'Jane Doe' }) },
      update: { data: expect.objectContaining({ name: 'Jane Doe' }) },
    });
  });

  it('throws ProfileValidationError when profile data is invalid', async () => {
    const invalidProfile = { name: 'No Email' } as unknown as MasterProfile;

    await expect(saveProfile('user-123', invalidProfile)).rejects.toThrow(ProfileValidationError);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('validates before writing — DB is never called on invalid input', async () => {
    const invalidProfile = { schemaVersion: 1, name: '', email: 'bad' } as unknown as MasterProfile;

    await expect(saveProfile('user-123', invalidProfile)).rejects.toThrow(ProfileValidationError);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('calls upsert with correct userId on second save (update path)', async () => {
    await saveProfile('user-456', validProfile);
    await saveProfile('user-456', { ...validProfile, name: 'Jane Updated' });

    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { userId: 'user-456' },
        update: { data: expect.objectContaining({ name: 'Jane Updated' }) },
      })
    );
  });
});
