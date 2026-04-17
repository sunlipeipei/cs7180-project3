/**
 * Integration smoke tests for jobDescriptionRepository.
 * Hits the real Neon DB — requires DATABASE_URL_TEST in .env
 *
 * Run with: npm run test:integration
 * Skipped automatically when DATABASE_URL_TEST is unset.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { randomBytes } from 'crypto';
import type { PrismaClient as PrismaClientType } from '../../../generated/prisma';

const runIntegration = Boolean(process.env.DATABASE_URL_TEST);

let prisma: PrismaClientType;

if (runIntegration) {
  const { PrismaClient } = await import('../../../generated/prisma');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_TEST! });
  prisma = new PrismaClient({ adapter });
}

// Unique prefix per test-file run
const FILE_PREFIX = `user_it_${randomBytes(8).toString('hex')}`;

afterAll(async () => {
  if (!runIntegration) return;
  // Cascade deletes JobDescriptions via FK
  await prisma.user.deleteMany({ where: { id: { startsWith: FILE_PREFIX } } });
  await prisma.$disconnect();
});

describe.skipIf(!runIntegration)('jobDescriptionRepository — integration', () => {
  it('saves a JD and lists it back for the owning user', async () => {
    const { saveJobDescription, getJobDescriptionsByUser } = await import(
      '../jobDescriptionRepository'
    );

    const userId = `${FILE_PREFIX}_1`;
    const email = `${FILE_PREFIX}_1@integration.test`;

    try {
      await prisma.user.create({ data: { id: userId, email } });

      const saved = await saveJobDescription(userId, {
        type: 'text',
        rawText: 'Senior TypeScript Engineer — remote, 5+ years required.',
        sourceUrl: undefined,
      });

      expect(saved.id).toBeTruthy();
      expect(saved.userId).toBe(userId);

      const list = await getJobDescriptionsByUser(userId);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(saved.id);
      expect(list[0].content).toBe('Senior TypeScript Engineer — remote, 5+ years required.');
    } finally {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  });

  it("another user's JD list does not include this user's JD (access scoping)", async () => {
    const { saveJobDescription, getJobDescriptionsByUser } = await import(
      '../jobDescriptionRepository'
    );

    const userId1 = `${FILE_PREFIX}_2`;
    const userId2 = `${FILE_PREFIX}_3`;

    try {
      await prisma.user.createMany({
        data: [
          { id: userId1, email: `${FILE_PREFIX}_2@integration.test` },
          { id: userId2, email: `${FILE_PREFIX}_3@integration.test` },
        ],
      });

      await saveJobDescription(userId1, {
        type: 'text',
        rawText: 'Backend role owned by user 1',
        sourceUrl: undefined,
      });

      const user2List = await getJobDescriptionsByUser(userId2);
      expect(user2List).toHaveLength(0);
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [userId1, userId2] } } });
    }
  });

  it('getJobDescriptionsByUser returns empty array when user has no JDs', async () => {
    const { getJobDescriptionsByUser } = await import('../jobDescriptionRepository');

    const userId = `${FILE_PREFIX}_4`;
    const email = `${FILE_PREFIX}_4@integration.test`;

    try {
      await prisma.user.create({ data: { id: userId, email } });

      const list = await getJobDescriptionsByUser(userId);
      expect(list).toHaveLength(0);
    } finally {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  });
});
