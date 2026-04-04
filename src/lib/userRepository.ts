import { prisma } from './prisma';

export async function upsertUser(clerkId: string, email: string) {
  if (!clerkId) throw new Error('clerkId is required');
  if (!email) throw new Error('email is required');

  return prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({ where: { clerkId } });
}
