import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    jobDescription: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import {
  saveJobDescription,
  getJobDescriptionsByUser,
  getJobDescriptionById,
  deleteJobDescription,
} from '../jobDescriptionRepository';
import { prisma } from '../../prisma';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  jobDescription: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const mockJd = {
  id: 'jd-cuid-123',
  userId: 'user-cuid-abc',
  content: 'Senior Software Engineer role requiring 5+ years TypeScript.',
  sourceUrl: null,
  title: null,
  company: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue({
    id: 'user-cuid-abc',
    clerkId: 'user-clerk-abc',
    email: 'test@example.com',
  });
});

describe('saveJobDescription', () => {
  it('saves a text job description for a user', async () => {
    mockPrisma.jobDescription.create.mockResolvedValue(mockJd);

    const result = await saveJobDescription('user-cuid-abc', {
      rawText: 'Senior Software Engineer role requiring 5+ years TypeScript.',
      type: 'text',
    });

    expect(mockPrisma.jobDescription.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-cuid-abc',
        content: 'Senior Software Engineer role requiring 5+ years TypeScript.',
        sourceUrl: undefined,
      },
    });
    expect(result).toEqual(mockJd);
  });

  it('saves a URL job description with sourceUrl', async () => {
    const jdWithUrl = { ...mockJd, sourceUrl: 'https://example.com/jobs/123' };
    mockPrisma.jobDescription.create.mockResolvedValue(jdWithUrl);

    const result = await saveJobDescription('user-cuid-abc', {
      rawText: 'Senior Software Engineer role.',
      type: 'url',
      sourceUrl: 'https://example.com/jobs/123',
    });

    expect(mockPrisma.jobDescription.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-cuid-abc',
        content: 'Senior Software Engineer role.',
        sourceUrl: 'https://example.com/jobs/123',
      },
    });
    expect(result.sourceUrl).toBe('https://example.com/jobs/123');
  });

  it('throws when userId is empty', async () => {
    await expect(saveJobDescription('', { rawText: 'Some job', type: 'text' })).rejects.toThrow(
      'userId is required'
    );
  });
});

describe('getJobDescriptionsByUser', () => {
  it('returns all job descriptions for a user', async () => {
    mockPrisma.jobDescription.findMany.mockResolvedValue([mockJd]);

    const result = await getJobDescriptionsByUser('user-cuid-abc');

    expect(mockPrisma.jobDescription.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-cuid-abc' },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([mockJd]);
  });

  it('returns empty array when user has no job descriptions', async () => {
    mockPrisma.jobDescription.findMany.mockResolvedValue([]);

    const result = await getJobDescriptionsByUser('user-cuid-abc');
    expect(result).toEqual([]);
  });

  it('throws when no internal user matches the Clerk user id', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getJobDescriptionsByUser('missing-user')).rejects.toThrow('User record not found');
  });
});

describe('getJobDescriptionById', () => {
  it('returns the job description when it belongs to the user', async () => {
    mockPrisma.jobDescription.findFirst.mockResolvedValue(mockJd);

    const result = await getJobDescriptionById('jd-cuid-123', 'user-cuid-abc');

    expect(mockPrisma.jobDescription.findFirst).toHaveBeenCalledWith({
      where: { id: 'jd-cuid-123', userId: 'user-cuid-abc' },
    });
    expect(result).toEqual(mockJd);
  });

  it('returns null when job description belongs to a different user', async () => {
    mockPrisma.jobDescription.findFirst.mockResolvedValue(null);

    const result = await getJobDescriptionById('jd-cuid-123', 'other-user');
    expect(result).toBeNull();
  });
});

describe('deleteJobDescription', () => {
  it('deletes a job description scoped to the user', async () => {
    mockPrisma.jobDescription.findFirst.mockResolvedValue(mockJd);
    mockPrisma.jobDescription.delete.mockResolvedValue(mockJd);

    await deleteJobDescription('jd-cuid-123', 'user-cuid-abc');

    expect(mockPrisma.jobDescription.delete).toHaveBeenCalledWith({
      where: { id: 'jd-cuid-123' },
    });
  });

  it('throws when job description does not belong to the user', async () => {
    mockPrisma.jobDescription.findFirst.mockResolvedValue(null);

    await expect(deleteJobDescription('jd-cuid-123', 'other-user')).rejects.toThrow('Not found');
  });
});
