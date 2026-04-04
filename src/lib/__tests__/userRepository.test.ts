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

import { upsertUser, getUserByClerkId } from '../userRepository';
import { prisma } from '../prisma';

const mockPrisma = prisma as unknown as {
  user: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
};

const mockUser = {
  id: 'cuid-123',
  clerkId: 'user_clerk_abc',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('upsertUser', () => {
  it('creates a new user when clerkId does not exist', async () => {
    mockPrisma.user.upsert.mockResolvedValue(mockUser);

    const result = await upsertUser('user_clerk_abc', 'test@example.com');

    expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk_abc' },
      update: { email: 'test@example.com' },
      create: { clerkId: 'user_clerk_abc', email: 'test@example.com' },
    });
    expect(result).toEqual(mockUser);
  });

  it('updates email when user already exists', async () => {
    const updatedUser = { ...mockUser, email: 'new@example.com' };
    mockPrisma.user.upsert.mockResolvedValue(updatedUser);

    const result = await upsertUser('user_clerk_abc', 'new@example.com');

    expect(result.email).toBe('new@example.com');
  });

  it('throws when clerkId is empty', async () => {
    await expect(upsertUser('', 'test@example.com')).rejects.toThrow();
  });

  it('throws when email is empty', async () => {
    await expect(upsertUser('user_clerk_abc', '')).rejects.toThrow();
  });
});

describe('getUserByClerkId', () => {
  it('returns user when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await getUserByClerkId('user_clerk_abc');

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { clerkId: 'user_clerk_abc' },
    });
    expect(result).toEqual(mockUser);
  });

  it('returns null when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getUserByClerkId('nonexistent');

    expect(result).toBeNull();
  });
});
