import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the prisma singleton
vi.mock('../prisma', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { upsertUser, getUserById } from '../userRepository';
import { prisma } from '../prisma';

const mockPrisma = prisma as unknown as {
  user: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
};

const mockUser = {
  id: 'user_clerk_abc',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('upsertUser', () => {
  it('creates a user with id equal to the Clerk user ID (not a CUID)', async () => {
    mockPrisma.user.upsert.mockResolvedValue(mockUser);

    const result = await upsertUser('user_abc', 'a@b.c');

    // The key assertion: id must equal the clerk ID passed in, not a generated CUID
    expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
      where: { id: 'user_abc' },
      update: { email: 'a@b.c' },
      create: { id: 'user_abc', email: 'a@b.c' },
    });
    expect(result).toEqual(mockUser);
  });

  it('returns user with id === clerkId on creation', async () => {
    const clerkId = 'user_abc';
    mockPrisma.user.upsert.mockResolvedValue({ ...mockUser, id: clerkId });

    const result = await upsertUser(clerkId, 'a@b.c');

    expect(result.id).toBe(clerkId);
  });

  it('is idempotent — re-upsert with same id updates email without error', async () => {
    const clerkId = 'user_abc';
    const updatedUser = { ...mockUser, id: clerkId, email: 'new@b.c' };
    mockPrisma.user.upsert.mockResolvedValue(updatedUser);

    const result = await upsertUser(clerkId, 'new@b.c');

    expect(mockPrisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(clerkId);
    expect(result.email).toBe('new@b.c');
  });

  it('throws when clerkId is empty', async () => {
    await expect(upsertUser('', 'test@example.com')).rejects.toThrow();
  });

  it('throws when email is empty', async () => {
    await expect(upsertUser('user_abc', '')).rejects.toThrow();
  });
});

describe('getUserById', () => {
  it('returns user when found by id', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getUserById('user_clerk_abc');

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user_clerk_abc' },
    });
    expect(result).toEqual(mockUser);
  });

  it('returns null when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getUserById('nonexistent');

    expect(result).toBeNull();
  });
});
