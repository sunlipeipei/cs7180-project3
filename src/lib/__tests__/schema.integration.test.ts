/**
 * Integration tests for Prisma schema constraints.
 * These tests hit the real Neon database — requires DATABASE_URL in .env
 *
 * Run with: vitest run src/lib/__tests__/schema.integration.test.ts
 */
import { describe, it, expect, afterAll, afterEach } from 'vitest';
import type { PrismaClient as PrismaClientType } from '../../generated/prisma';

const hasDb = !!process.env.DATABASE_URL;

let prisma: PrismaClientType;

if (hasDb) {
  const { PrismaClient } = await import('../../generated/prisma');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  prisma = new PrismaClient({ adapter });
}

// Unique prefix per test run to avoid cross-run collisions
const RUN_ID = Date.now().toString(36);
const uid = (n: number) => `test-${RUN_ID}-${n}`;

// Post-collapse: User.id is the Clerk user ID (no clerkId column).
const makeUser = (n: number) => ({
  id: `user_${uid(n)}`,
  email: `user-${uid(n)}@test.com`,
});

afterEach(async () => {
  if (!hasDb) return;
  // Clean up all test users (cascades to Profile, Resume, JobDescription)
  await prisma.user.deleteMany({
    where: { email: { contains: `${RUN_ID}@test.com` } },
  });
});

afterAll(async () => {
  if (!hasDb) return;
  await prisma.$disconnect();
});

// ─── User constraints ─────────────────────────────────────────────────────────

describe.skipIf(!hasDb)('User model constraints', () => {
  it('enforces unique id (Clerk ID)', async () => {
    const base = makeUser(1);
    await prisma.user.create({ data: base });

    await expect(
      prisma.user.create({ data: { ...base, email: `other-${uid(1)}@test.com` } })
    ).rejects.toThrow();
  });

  it('enforces unique email', async () => {
    const base = makeUser(2);
    await prisma.user.create({ data: base });

    await expect(
      prisma.user.create({ data: { id: `user_other-${uid(2)}`, email: base.email } })
    ).rejects.toThrow();
  });

  it('rejects a Profile with a non-existent userId (FK constraint)', async () => {
    await expect(
      prisma.profile.create({ data: { userId: 'non-existent-id', data: {} } })
    ).rejects.toThrow();
  });

  it('creates a user with all required fields, id equals Clerk ID', async () => {
    const user = await prisma.user.create({ data: makeUser(4) });
    expect(user.id).toBe(`user_${uid(4)}`);
    expect(user.createdAt).toBeInstanceOf(Date);
  });
});

// ─── Profile constraints ──────────────────────────────────────────────────────

describe.skipIf(!hasDb)('Profile model constraints', () => {
  it('enforces one profile per user (unique userId)', async () => {
    const user = await prisma.user.create({ data: makeUser(10) });
    const data = { schemaVersion: 1, name: 'Test' };

    await prisma.profile.create({ data: { userId: user.id, data } });

    await expect(prisma.profile.create({ data: { userId: user.id, data } })).rejects.toThrow();
  });

  it('cascades delete to Profile when User is deleted', async () => {
    const user = await prisma.user.create({ data: makeUser(11) });
    await prisma.profile.create({ data: { userId: user.id, data: { schemaVersion: 1 } } });

    await prisma.user.delete({ where: { id: user.id } });

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    expect(profile).toBeNull();
  });
});

// ─── JobDescription constraints ───────────────────────────────────────────────

describe.skipIf(!hasDb)('JobDescription model constraints', () => {
  it('creates a job description linked to a user', async () => {
    const user = await prisma.user.create({ data: makeUser(20) });
    const jd = await prisma.jobDescription.create({
      data: { userId: user.id, content: 'We are looking for a senior engineer...' },
    });

    expect(jd.id).toBeTruthy();
    expect(jd.title).toBeNull(); // optional field
  });

  it('cascades delete to JobDescription when User is deleted', async () => {
    const user = await prisma.user.create({ data: makeUser(21) });
    const jd = await prisma.jobDescription.create({
      data: { userId: user.id, content: 'Some JD' },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const found = await prisma.jobDescription.findUnique({ where: { id: jd.id } });
    expect(found).toBeNull();
  });
});

// ─── Resume constraints ───────────────────────────────────────────────────────

describe.skipIf(!hasDb)('Resume model constraints', () => {
  it('creates a resume linked to a user', async () => {
    const user = await prisma.user.create({ data: makeUser(30) });
    const resume = await prisma.resume.create({
      data: { userId: user.id, content: { sections: [] } },
    });

    expect(resume.id).toBeTruthy();
    expect(resume.jobDescriptionId).toBeNull();
    expect(resume.pdfPath).toBeNull();
  });

  it('links a resume to a job description', async () => {
    const user = await prisma.user.create({ data: makeUser(31) });
    const jd = await prisma.jobDescription.create({
      data: { userId: user.id, content: 'Some JD' },
    });
    const resume = await prisma.resume.create({
      data: { userId: user.id, jobDescriptionId: jd.id, content: {} },
    });

    expect(resume.jobDescriptionId).toBe(jd.id);
  });

  it('cascades delete to Resume when User is deleted', async () => {
    const user = await prisma.user.create({ data: makeUser(32) });
    const resume = await prisma.resume.create({
      data: { userId: user.id, content: {} },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const found = await prisma.resume.findUnique({ where: { id: resume.id } });
    expect(found).toBeNull();
  });

  it('sets pdfPath when provided', async () => {
    const user = await prisma.user.create({ data: makeUser(33) });
    const resume = await prisma.resume.create({
      data: { userId: user.id, content: {}, pdfPath: '/tmp/resume.pdf' },
    });

    expect(resume.pdfPath).toBe('/tmp/resume.pdf');
  });
});
