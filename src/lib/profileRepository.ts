import { prisma } from './prisma';
import { MasterProfileSchema } from '../profile/schema';
import { MasterProfile } from '../profile/types';
import { ProfileValidationError } from '../profile/errors';

/**
 * Load the authenticated user's profile from the database.
 * Returns null if no profile exists yet.
 */
export async function getProfile(userId: string): Promise<MasterProfile | null> {
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
export async function saveProfile(userId: string, profile: MasterProfile): Promise<void> {
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
