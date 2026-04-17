/**
 * Integration smoke tests for userRepository.
 * Hits the real Neon DB — requires DATABASE_URL_TEST in .env
 *
 * Run with: npm run test:integration
 * Skipped automatically when DATABASE_URL_TEST is unset.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { randomBytes } from 'crypto';
import type { PrismaClient as PrismaClientType } from '../../generated/prisma';

const runIntegration = Boolean(process.env.DATABASE_URL_TEST);

let prisma: PrismaClientType;

if (runIntegration) {
  const { PrismaClient } = await import('../../generated/prisma');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_TEST! });
  prisma = new PrismaClient({ adapter });
}

// Unique prefix per test-file run — avoids cross-run and cross-branch CI collisions
const FILE_PREFIX = `user_it_${randomBytes(8).toString('hex')}`;

afterAll(async () => {
  if (!runIntegration) return;
  await prisma.user.deleteMany({ where: { id: { startsWith: FILE_PREFIX } } });
  await prisma.$disconnect();
});

describe.skipIf(!runIntegration)('userRepository — integration', () => {
  it('creates a user and fetches it back with id === clerkId input', async () => {
    const { upsertUser, getUserById } = await import('../userRepository');

    const clerkId = `${FILE_PREFIX}_1`;
    const email = `${FILE_PREFIX}_1@integration.test`;

    let userId: string | undefined;
    try {
      const created = await upsertUser(clerkId, email);
      userId = created.id;

      expect(created.id).toBe(clerkId);
      expect(created.email).toBe(email);

      const fetched = await getUserById(clerkId);
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(clerkId);
      expect(fetched!.email).toBe(email);
    } finally {
      if (userId) {
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    }
  });

  it('upsertUser is idempotent — second call updates email without error', async () => {
    const { upsertUser } = await import('../userRepository');

    const clerkId = `${FILE_PREFIX}_2`;
    const email1 = `${FILE_PREFIX}_2a@integration.test`;
    const email2 = `${FILE_PREFIX}_2b@integration.test`;

    try {
      await upsertUser(clerkId, email1);
      const updated = await upsertUser(clerkId, email2);

      expect(updated.id).toBe(clerkId);
      expect(updated.email).toBe(email2);
    } finally {
      await prisma.user.deleteMany({ where: { id: clerkId } });
    }
  });

  it('getUserById returns null for a non-existent user', async () => {
    const { getUserById } = await import('../userRepository');

    const result = await getUserById(`${FILE_PREFIX}_nonexistent`);
    expect(result).toBeNull();
  });
});
