import { prisma } from './prisma';
import { TailoredResumeSchema, type TailoredResume } from '../ai/schemas';

/**
 * Persist a freshly-generated tailored resume. The AI-assigned resumeId is
 * replaced with the database row id so every downstream reference is
 * Prisma-sourced — never trust the model's identifier.
 */
export async function createResume(
  userId: string,
  jobDescriptionId: string,
  resume: TailoredResume
): Promise<TailoredResume> {
  const row = await prisma.resume.create({
    data: {
      userId,
      jobDescriptionId,
      content: resume as unknown as object,
    },
  });

  const canonical: TailoredResume = {
    ...resume,
    resumeId: row.id,
    jobDescriptionId,
    updatedAt: row.updatedAt.toISOString(),
  };

  await prisma.resume.update({
    where: { id: row.id },
    data: { content: canonical as unknown as object },
  });

  return canonical;
}

/** Load a resume scoped to the session user. Returns null on cross-user access. */
export async function getResume(id: string, userId: string): Promise<TailoredResume | null> {
  const row = await prisma.resume.findFirst({ where: { id, userId } });
  if (!row) return null;

  const parsed = TailoredResumeSchema.safeParse(row.content);
  if (!parsed.success) {
    throw new Error(`Stored resume ${id} failed schema validation`);
  }
  return parsed.data;
}

/** List all resumes for the signed-in user, newest first. */
export async function listResumes(userId: string): Promise<TailoredResume[]> {
  const rows = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.flatMap((row) => {
    const parsed = TailoredResumeSchema.safeParse(row.content);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Overwrite an existing resume's content. No versioning in V1 — last-writer-wins. */
export async function updateResume(
  id: string,
  userId: string,
  resume: TailoredResume
): Promise<TailoredResume> {
  // Use updateMany so the WHERE clause is both id AND userId. Prisma
  // update() requires a unique predicate (id alone) and silently ignores
  // extra fields — updateMany actually scopes the write, which means a
  // resume id discovered through another channel cannot be overwritten
  // by a different session user.
  const prepared: TailoredResume = { ...resume, resumeId: id };
  const { count } = await prisma.resume.updateMany({
    where: { id, userId },
    data: { content: prepared as unknown as object },
  });
  if (count === 0) {
    throw new Error(`Resume ${id} not found for user`);
  }

  const fresh = await prisma.resume.findFirst({ where: { id, userId } });
  if (!fresh) {
    throw new Error(`Resume ${id} vanished mid-update`);
  }

  return {
    ...prepared,
    updatedAt: fresh.updatedAt.toISOString(),
  };
}
