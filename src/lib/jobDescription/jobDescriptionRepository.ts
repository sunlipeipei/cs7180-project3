import { prisma } from '../prisma';
import type { ParsedJobDescription } from './types';

export async function saveJobDescription(userId: string, jd: ParsedJobDescription) {
  if (!userId) throw new Error('userId is required');

  return prisma.jobDescription.create({
    data: {
      userId,
      content: jd.rawText,
      sourceUrl: jd.sourceUrl,
    },
  });
}

export async function getJobDescriptionsByUser(userId: string) {
  return prisma.jobDescription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getJobDescriptionById(id: string, userId: string) {
  return prisma.jobDescription.findFirst({
    where: { id, userId },
  });
}

export async function deleteJobDescription(id: string, userId: string) {
  const existing = await prisma.jobDescription.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Not found');

  return prisma.jobDescription.delete({ where: { id } });
}
