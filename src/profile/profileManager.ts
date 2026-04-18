import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ZodError } from 'zod';
import { MasterProfileSchema } from './schema';
import { ProfileNotFoundError, ProfileIOError, ProfileValidationError } from './errors';
import type { MasterProfile } from './types';

export async function loadProfile(path: string): Promise<MasterProfile> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new ProfileNotFoundError(path);
    }
    throw new ProfileIOError(`Failed to read profile: ${err.message}`, err);
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new ProfileIOError(`Failed to parse JSON from ${path}`);
  }

  try {
    return MasterProfileSchema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ProfileValidationError(err);
    }
    throw err;
  }
}

export async function saveProfile(profile: MasterProfile, path: string): Promise<void> {
  // Validate before writing
  try {
    MasterProfileSchema.parse(profile);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ProfileValidationError(err);
    }
    throw err;
  }

  try {
    const dir = dirname(path);
    await mkdir(dir, { recursive: true });
    await writeFile(path, JSON.stringify(profile, null, 2) + '\n', 'utf-8');
  } catch (err: any) {
    throw new ProfileIOError(`Failed to write profile: ${err.message}`, err);
  }
}
