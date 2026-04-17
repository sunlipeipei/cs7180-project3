import { prisma } from './prisma';

/**
 * Upsert a user using their Clerk user ID as the primary key.
 * User.id equals the Clerk ID — no separate clerkId column.
 */
export async function upsertUser(clerkId: string, email: string) {
  if (!clerkId) throw new Error('clerkId is required');
  if (!email) throw new Error('email is required');

  return prisma.user.upsert({
    where: { id: clerkId },
    update: { email },
    create: { id: clerkId, email },
  });
}

/**
 * Look up a user by their Clerk user ID (which is also User.id).
 */
export async function getUserById(clerkId: string) {
  return prisma.user.findUnique({ where: { id: clerkId } });
}
