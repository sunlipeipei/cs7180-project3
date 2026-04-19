/**
 * Integration tests for POST /api/resumes/[resumeId]/refine
 *
 * These tests hit the real Neon DB (DATABASE_URL_TEST) and exercise the full
 * route → resumeRepository → Prisma → Postgres round-trip. They catch
 * regressions the unit layer cannot see: Prisma schema drift, FK constraints,
 * JSON round-tripping of TailoredResume through Postgres, and userId scoping
 * at the SQL level.
 *
 * Auth note: Clerk testing tokens are not wired on this project — the
 * DEV_AUTH_BYPASS path is the pragmatic integration surface. The route calls
 * getAuth() from src/lib/auth, which returns { userId: process.env.DEV_USER_ID }
 * when NODE_ENV !== 'production' && DEV_AUTH_BYPASS === '1'. Vitest runs with
 * NODE_ENV=test, and .env.local sets DEV_AUTH_BYPASS=1. We set DEV_USER_ID per
 * test inside try/finally to control which user the route sees. Real Clerk
 * token support is a deferred follow-up (see project notes).
 *
 * Run with: npm run test:integration
 * Skipped automatically when DATABASE_URL_TEST is unset.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import { randomBytes } from 'crypto';
import type { PrismaClient as PrismaClientType } from '../../../../../src/generated/prisma';

// ---------------------------------------------------------------------------
// Only stub the AI client — everything else (repository, auth, Prisma) runs
// against the real implementation so the integration surface is maximised.
// ---------------------------------------------------------------------------
const parseMock = vi.fn();

vi.mock('../../../../../src/ai/client', () => ({
  getClient: () => ({
    chat: {
      completions: {
        parse: parseMock,
      },
    },
  }),
  getModel: () => 'test-model',
}));

import { resumesFixture } from '../../../../../src/fixtures/index';
import { TailoredResumeSchema } from '../../../../../src/ai/schemas';
import { POST } from './route';

// ---------------------------------------------------------------------------
// Guard — skip the whole suite when the test DB is unavailable
// ---------------------------------------------------------------------------
const runIntegration = Boolean(process.env.DATABASE_URL_TEST);

let prisma: PrismaClientType;

if (runIntegration) {
  const { PrismaClient } = await import('../../../../../src/generated/prisma');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_TEST! });
  prisma = new PrismaClient({ adapter });
}

// Unique prefix per test-file run — avoids cross-run and cross-branch CI collisions
const FILE_PREFIX = `resume_it_${randomBytes(8).toString('hex')}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paramsFor(resumeId: string): { params: Promise<{ resumeId: string }> } {
  return { params: Promise.resolve({ resumeId }) };
}

function makeRequest(resumeId: string, body: unknown): Request {
  const url = `http://localhost/api/resumes/${resumeId}/refine`;
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function fakeCompletion(markdown: string) {
  return {
    choices: [{ message: { parsed: { updatedMarkdown: markdown } } }],
    usage: { prompt_tokens: 100, completion_tokens: 50 },
  };
}

/**
 * Seed a User row with the given id prefix and a unique email.
 * Returns the userId used.
 */
async function seedUser(idSuffix: string): Promise<string> {
  const userId = `${FILE_PREFIX}_${idSuffix}`;
  await prisma.user.create({
    data: {
      id: userId,
      email: `${userId}@integration.test`,
    },
  });
  return userId;
}

/**
 * Seed a JobDescription row linked to the given user. Returns the JD id.
 */
async function seedJobDescription(userId: string): Promise<string> {
  const jd = await prisma.jobDescription.create({
    data: {
      userId,
      content: 'Senior TypeScript Engineer — integration test JD',
    },
  });
  return jd.id;
}

/**
 * Seed a Resume row using createResume from the repository (exercises
 * the two-step create+update canonicalisation). Returns the TailoredResume
 * with the Prisma-assigned id in resumeId.
 */
async function seedResumeViaRepo(
  userId: string,
  jobDescriptionId: string
): Promise<import('../../../../../src/ai/schemas').TailoredResume> {
  const { createResume } = await import('../../../../../src/lib/resumeRepository');
  const fixture = resumesFixture[1];
  return createResume(userId, jobDescriptionId, fixture);
}

/**
 * Seed a Resume row with raw Prisma, giving full control over the stored JSON.
 * Returns the Prisma row so the caller can read row.id and row.updatedAt.
 */
async function seedResumeRaw(
  userId: string,
  jobDescriptionId: string | null
): Promise<{ id: string; updatedAt: Date; content: unknown }> {
  const fixture = resumesFixture[1];
  // First create with a placeholder resumeId, then update with the real id.
  const row = await prisma.resume.create({
    data: {
      userId,
      jobDescriptionId: jobDescriptionId ?? undefined,
      content: { ...fixture, resumeId: 'placeholder' } as unknown as object,
    },
  });
  const updated = await prisma.resume.update({
    where: { id: row.id },
    data: {
      content: {
        ...fixture,
        resumeId: row.id,
        updatedAt: row.updatedAt.toISOString(),
      } as unknown as object,
    },
  });
  return { id: updated.id, updatedAt: updated.updatedAt, content: updated.content };
}

// ---------------------------------------------------------------------------
// Teardown — cascade through Resume / JD via FK
// ---------------------------------------------------------------------------
afterAll(async () => {
  if (!runIntegration) return;
  await prisma.user.deleteMany({ where: { id: { startsWith: FILE_PREFIX } } });
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe.skipIf(!runIntegration)('POST /api/resumes/[resumeId]/refine — integration', () => {
  beforeAll(() => {
    // Ensure DEV_AUTH_BYPASS is enabled for the test environment
    process.env.DEV_AUTH_BYPASS = '1';
  });

  // -----------------------------------------------------------------------
  // Case 1 — Byte-identical untouched sections (headline guarantee)
  // -----------------------------------------------------------------------
  it('leaves all untouched sections byte-identical after a summary refine', async () => {
    const userId = await seedUser('c1_summary');
    const jdId = await seedJobDescription(userId);

    const original = process.env.DEV_USER_ID;
    process.env.DEV_USER_ID = userId;

    try {
      const seeded = await seedResumeViaRepo(userId, jdId);
      const resumeId = seeded.resumeId;

      parseMock.mockResolvedValueOnce(fakeCompletion('## Summary\nIntegration stubbed.'));

      const res = await POST(
        makeRequest(resumeId, { section: 'summary', instruction: 'Tighten the summary' }),
        paramsFor(resumeId)
      );

      expect(res.status).toBe(200);

      // Re-read directly from DB — no cache
      const row = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
      expect(row).not.toBeNull();

      const parsed = TailoredResumeSchema.safeParse(row!.content);
      expect(parsed.success).toBe(true);
      const data = parsed.data!;

      // The updated section must contain the stub's markdown
      expect(data.summary).toBe('## Summary\nIntegration stubbed.');

      // All other sections must be byte-identical to the seeded fixture
      const fixture = resumesFixture[1];
      expect(data.header).toBe(fixture.header);
      expect(data.skills).toBe(fixture.skills);
      expect(data.experience).toBe(fixture.experience);
      expect(data.education).toBe(fixture.education);
      expect(data.projects).toBe(fixture.projects);
    } finally {
      process.env.DEV_USER_ID = original;
      await prisma.resume.deleteMany({ where: { userId } });
      await prisma.jobDescription.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  });

  // -----------------------------------------------------------------------
  // Case 2 — All 6 section enums round-trip through DB
  // -----------------------------------------------------------------------
  it.each(['header', 'summary', 'skills', 'experience', 'education', 'projects'] as const)(
    'section "%s" updates only that section and leaves the other 5 byte-identical',
    async (section) => {
      const userId = await seedUser(`c2_enum_${section}`);
      const jdId = await seedJobDescription(userId);

      const original = process.env.DEV_USER_ID;
      process.env.DEV_USER_ID = userId;

      try {
        const seeded = await seedResumeViaRepo(userId, jdId);
        const resumeId = seeded.resumeId;

        const stubbedMarkdown = `## ${section}\nIntegration stubbed for ${section}.`;
        parseMock.mockResolvedValueOnce(fakeCompletion(stubbedMarkdown));

        const res = await POST(
          makeRequest(resumeId, {
            section,
            instruction: `Improve the ${section} section`,
          }),
          paramsFor(resumeId)
        );

        expect(res.status).toBe(200);

        const row = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
        expect(row).not.toBeNull();

        const parsed = TailoredResumeSchema.safeParse(row!.content);
        expect(parsed.success).toBe(true);
        const data = parsed.data!;

        // Updated section must equal the stub
        expect(data[section]).toBe(stubbedMarkdown);

        // Every other section must be byte-identical to the fixture seed
        const fixture = resumesFixture[1];
        const allSections = [
          'header',
          'summary',
          'skills',
          'experience',
          'education',
          'projects',
        ] as const;
        for (const other of allSections) {
          if (other !== section) {
            expect(data[other]).toBe(fixture[other]);
          }
        }
      } finally {
        process.env.DEV_USER_ID = original;
        await prisma.resume.deleteMany({ where: { userId } });
        await prisma.jobDescription.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
      }
    }
  );

  // -----------------------------------------------------------------------
  // Case 3 — Cross-user 404 + no mutation (A01 access-control guarantee)
  // -----------------------------------------------------------------------
  it('returns 404 for cross-user access and leaves the resume untouched', async () => {
    const userAId = await seedUser('c3_userA');
    const userBId = await seedUser('c3_userB');
    const jdId = await seedJobDescription(userAId);

    const original = process.env.DEV_USER_ID;

    // Reset the mock before this test so calls from case 2's it.each do not
    // leak into this assertion. parseMock is module-level and shared across
    // all tests in the file.
    parseMock.mockReset();

    try {
      // Seed a resume belonging to userA using raw Prisma for exact content control
      const { id: resumeId, content: originalContent } = await seedResumeRaw(userAId, jdId);

      // Authenticate as userB — they must not be able to see userA's resume
      process.env.DEV_USER_ID = userBId;

      const res = await POST(
        makeRequest(resumeId, { section: 'summary', instruction: 'x' }),
        paramsFor(resumeId)
      );

      expect(res.status).toBe(404);

      // Re-read userA's resume — content must be deep-equal to original seed
      const row = await prisma.resume.findFirst({ where: { id: resumeId, userId: userAId } });
      expect(row).not.toBeNull();
      expect(row!.content).toEqual(originalContent);

      // AI client must never have been called during this test
      expect(parseMock).not.toHaveBeenCalled();
    } finally {
      process.env.DEV_USER_ID = original;
      await prisma.resume.deleteMany({ where: { userId: userAId } });
      await prisma.jobDescription.deleteMany({ where: { userId: userAId } });
      await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    }
  });

  // -----------------------------------------------------------------------
  // Case 4 — 400 on invalid body before any DB mutation
  // -----------------------------------------------------------------------
  it('returns 400 for missing instruction and does not touch the DB row', async () => {
    const userId = await seedUser('c4_invalid');
    const jdId = await seedJobDescription(userId);

    const original = process.env.DEV_USER_ID;
    process.env.DEV_USER_ID = userId;

    try {
      parseMock.mockReset();

      const { id: resumeId, updatedAt: seededUpdatedAt } = await seedResumeRaw(userId, jdId);

      const res = await POST(
        makeRequest(resumeId, { section: 'summary' /* instruction missing */ }),
        paramsFor(resumeId)
      );

      expect(res.status).toBe(400);

      // DB row must be untouched — updatedAt must equal the seeded timestamp
      const row = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
      expect(row).not.toBeNull();
      expect(row!.updatedAt.getTime()).toBe(seededUpdatedAt.getTime());

      // AI client must never have been called
      expect(parseMock).not.toHaveBeenCalled();
    } finally {
      process.env.DEV_USER_ID = original;
      await prisma.resume.deleteMany({ where: { userId } });
      await prisma.jobDescription.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  });
});
