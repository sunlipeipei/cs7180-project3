import { MasterProfileSchema } from '@/ai/schemas';
import type { MasterProfile } from '@/ai/schemas';
import { profileFixture } from '@/fixtures/index';
import { delay, clone } from './_helpers';

// Module-scoped mutable state — seeded from fixture at import time.
let _profile: MasterProfile = clone(profileFixture);

/**
 * Returns the current profile as a defensive deep copy.
 * Simulates ~80ms async latency to mirror a real HTTP fetch.
 */
export async function getProfile(): Promise<MasterProfile> {
  await delay();
  return clone(_profile);
}

/**
 * Validates the incoming profile with Zod (throws on invalid input),
 * persists it, and returns a defensive copy of what was stored.
 * Simulates ~80ms async latency.
 */
export async function saveProfile(profile: MasterProfile): Promise<MasterProfile> {
  // .parse() throws a ZodError if validation fails — intentional service-boundary guard.
  const validated = MasterProfileSchema.parse(profile);
  await delay();
  _profile = clone(validated);
  return clone(_profile);
}
