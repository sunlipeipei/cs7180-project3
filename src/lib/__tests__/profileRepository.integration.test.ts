/**
 * Integration smoke tests for profileRepository.
 * Hits the real Neon DB — requires DATABASE_URL_TEST in .env
 *
 * Run with: npm run test:integration
 * Skipped automatically when DATABASE_URL_TEST is unset.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { randomBytes } from 'crypto';
import type { PrismaClient as PrismaClientType } from '../../generated/prisma';
import type { MasterProfile } from '../../profile/types';

const runIntegration = Boolean(process.env.DATABASE_URL_TEST);

let prisma: PrismaClientType;

if (runIntegration) {
  const { PrismaClient } = await import('../../generated/prisma');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_TEST! });
  prisma = new PrismaClient({ adapter });
}

// Unique prefix per test-file run
const FILE_PREFIX = `user_it_${randomBytes(8).toString('hex')}`;

const validProfile: MasterProfile = {
  schemaVersion: 1,
  name: 'Integration Test User',
  email: 'it@integration.test',
  phone: '+1-555-000-0000',
  skills: [{ name: 'TypeScript' }],
  workExperience: [],
  education: [],
};

afterAll(async () => {
  if (!runIntegration) return;
  // Cascade deletes Profile via FK
  await prisma.user.deleteMany({ where: { id: { startsWith: FILE_PREFIX } } });
  await prisma.$disconnect();
});

describe.skipIf(!runIntegration)('profileRepository — integration', () => {
  it('saves a profile and reads it back with correct MasterProfile shape', async () => {
    const { getProfile, saveProfile } = await import('../profileRepository');

    const clerkId = `${FILE_PREFIX}_1`;
    const email = `${FILE_PREFIX}_1@integration.test`;

    try {
      await prisma.user.create({ data: { id: clerkId, email } });

      // Initially no profile
      const initial = await getProfile(clerkId);
      expect(initial).toBeNull();

      // Save a profile
      await saveProfile(clerkId, validProfile);

      // Read it back
      const fetched = await getProfile(clerkId);
      expect(fetched).not.toBeNull();
      expect(fetched!.schemaVersion).toBe(1);
      expect(fetched!.name).toBe('Integration Test User');
      expect(fetched!.email).toBe('it@integration.test');
      expect(Array.isArray(fetched!.skills)).toBe(true);
      expect(fetched!.skills![0].name).toBe('TypeScript');
    } finally {
      await prisma.user.deleteMany({ where: { id: clerkId } });
    }
  });

  it('saveProfile overwrites an existing profile (upsert semantics)', async () => {
    const { getProfile, saveProfile } = await import('../profileRepository');

    const clerkId = `${FILE_PREFIX}_2`;
    const email = `${FILE_PREFIX}_2@integration.test`;

    try {
      await prisma.user.create({ data: { id: clerkId, email } });

      await saveProfile(clerkId, validProfile);
      await saveProfile(clerkId, { ...validProfile, name: 'Updated Name' });

      const fetched = await getProfile(clerkId);
      expect(fetched!.name).toBe('Updated Name');
    } finally {
      await prisma.user.deleteMany({ where: { id: clerkId } });
    }
  });
});
