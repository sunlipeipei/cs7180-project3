import { prisma } from './prisma';
import { MasterProfileSchema } from '../profile/schema';
import { MasterProfile } from '../profile/types';
import { ProfileValidationError } from '../profile/errors';
import { getUserByClerkId } from './userRepository';

async function requireInternalUserId(clerkUserId: string): Promise<string> {
  if (!clerkUserId) throw new Error('userId is required');

  const user = await getUserByClerkId(clerkUserId);
  if (!user) {
    throw new Error('User record not found');
  }

  return user.id;
}

/**
 * Load the authenticated user's profile from the database.
 * Returns null if no profile exists yet.
 */
export async function getProfile(clerkUserId: string): Promise<MasterProfile | null> {
  const userId = await requireInternalUserId(clerkUserId);
  const record = await prisma.profile.findUnique({ where: { userId } });
  if (!record) return null;

  const result = MasterProfileSchema.safeParse(record.data);
  if (!result.success) {
    throw new ProfileValidationError(result.error);
  }
  return result.data;
}

/**
 * Upsert the authenticated user's profile in the database.
 */
export async function saveProfile(clerkUserId: string, profile: MasterProfile): Promise<void> {
  const userId = await requireInternalUserId(clerkUserId);
  const result = MasterProfileSchema.safeParse(profile);
  if (!result.success) {
    throw new ProfileValidationError(result.error);
  }

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, data: result.data as object },
    update: { data: result.data as object },
  });
}
