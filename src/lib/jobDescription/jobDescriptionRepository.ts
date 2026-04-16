import { prisma } from '../prisma';
import { getUserByClerkId } from '../userRepository';
import type { ParsedJobDescription } from './types';

async function requireInternalUserId(clerkUserId: string): Promise<string> {
  if (!clerkUserId) throw new Error('userId is required');

  const user = await getUserByClerkId(clerkUserId);
  if (!user) {
    throw new Error('User record not found');
  }

  return user.id;
}

export async function saveJobDescription(clerkUserId: string, jd: ParsedJobDescription) {
  const userId = await requireInternalUserId(clerkUserId);

  return prisma.jobDescription.create({
    data: {
      userId,
      content: jd.rawText,
      sourceUrl: jd.sourceUrl,
    },
  });
}

export async function getJobDescriptionsByUser(clerkUserId: string) {
  const userId = await requireInternalUserId(clerkUserId);

  return prisma.jobDescription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getJobDescriptionById(id: string, clerkUserId: string) {
  const userId = await requireInternalUserId(clerkUserId);

  return prisma.jobDescription.findFirst({
    where: { id, userId },
  });
}

export async function deleteJobDescription(id: string, clerkUserId: string) {
  const userId = await requireInternalUserId(clerkUserId);
  const existing = await prisma.jobDescription.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Not found');

  return prisma.jobDescription.delete({ where: { id } });
}
