/**
 * Isolation strategy: each test uses vi.resetModules() + dynamic import so it
 * gets a freshly-seeded module-scoped state. This prevents cross-test pollution
 * from saveProfile mutations persisting between cases.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MasterProfileSchema } from '@/ai/schemas.js';

// Fresh module import helper — resets module registry before each test.
async function freshService() {
  vi.resetModules();
  return import('../profile.service.js');
}

describe('profile.service', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('getProfile() returns a valid MasterProfile that passes Zod safeParse', async () => {
    const { getProfile } = await freshService();
    const profile = await getProfile();
    const result = MasterProfileSchema.safeParse(profile);
    expect(result.success).toBe(true);
  });

  it('getProfile() returns the fixture name on cold start', async () => {
    const { getProfile } = await freshService();
    const profile = await getProfile();
    expect(profile.name).toBe('Jordan Lee');
  });

  it('saveProfile(valid) persists — next getProfile() returns the new shape', async () => {
    const { getProfile, saveProfile } = await freshService();

    const original = await getProfile();
    const updated = { ...original, name: 'Alex Kim' };
    await saveProfile(updated);

    const fetched = await getProfile();
    expect(fetched.name).toBe('Alex Kim');
  });

  it('saveProfile returns the saved profile', async () => {
    const { getProfile, saveProfile } = await freshService();
    const original = await getProfile();
    const updated = { ...original, name: 'Morgan Chen' };
    const returned = await saveProfile(updated);
    expect(returned.name).toBe('Morgan Chen');
  });

  it('saveProfile(invalid) throws — missing required field "name"', async () => {
    const { getProfile, saveProfile } = await freshService();
    const original = await getProfile();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name: _name, ...withoutName } = original;
    await expect(saveProfile(withoutName as Parameters<typeof saveProfile>[0])).rejects.toThrow();
  });

  it('saveProfile(invalid) throws — invalid email format', async () => {
    const { getProfile, saveProfile } = await freshService();
    const original = await getProfile();
    await expect(
      saveProfile({ ...original, email: 'not-an-email' }),
    ).rejects.toThrow();
  });

  it('mutating the returned profile does NOT affect the next getProfile() (defensive copy)', async () => {
    const { getProfile } = await freshService();

    const profile1 = await getProfile();
    profile1.name = 'MUTATED';

    const profile2 = await getProfile();
    expect(profile2.name).toBe('Jordan Lee');
  });

  it('mutating a nested returned object does NOT affect next getProfile()', async () => {
    const { getProfile } = await freshService();

    const profile1 = await getProfile();
    if (profile1.skills.length > 0) {
      profile1.skills[0].name = 'MUTATED_SKILL';
    }

    const profile2 = await getProfile();
    expect(profile2.skills[0]?.name).not.toBe('MUTATED_SKILL');
  });

  it('getProfile() simulates latency (resolves after ~80ms)', async () => {
    const { getProfile } = await freshService();
    const start = Date.now();
    await getProfile();
    const elapsed = Date.now() - start;
    // Allow generous upper bound for CI variability
    expect(elapsed).toBeGreaterThanOrEqual(70);
    expect(elapsed).toBeLessThan(1000);
  });
});
