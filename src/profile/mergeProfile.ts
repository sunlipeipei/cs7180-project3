import { ZodError } from 'zod';
import { MasterProfileSchema } from './schema';
import { ProfileValidationError } from './errors';
import type { MasterProfile } from './types';

type DeepPartial<T> = {
  [P in keyof T]?: NonNullable<T[P]> extends (infer U)[]
    ? Partial<U>[]
    : NonNullable<T[P]> extends object
      ? DeepPartial<NonNullable<T[P]>>
      : T[P] | null;
};

type IdentityKey = (item: Record<string, unknown>) => string;

const ARRAY_IDENTITY_KEYS: Record<string, IdentityKey> = {
  skills: (item) => item.name as string,
  workExperience: (item) => `${item.company}|${item.title}|${item.startDate}`,
  education: (item) => `${item.school}|${item.degree}`,
  projects: (item) => item.name as string,
  certifications: (item) => `${item.name}|${item.issuer ?? ''}`,
};

function mergeArrays(
  base: Record<string, unknown>[],
  partial: Record<string, unknown>[],
  getKey: IdentityKey
): Record<string, unknown>[] {
  const result = base.map((item) => ({ ...item }));
  const baseKeyIndex = new Map<string, number>();
  for (let i = 0; i < result.length; i++) {
    baseKeyIndex.set(getKey(result[i]), i);
  }

  for (const partialItem of partial) {
    const key = getKey(partialItem);
    const existingIdx = baseKeyIndex.get(key);

    if (existingIdx !== undefined) {
      const existing = result[existingIdx];
      for (const [field, value] of Object.entries(partialItem)) {
        if (value === undefined) continue;
        if (value === null) {
          delete existing[field];
        } else {
          existing[field] = value;
        }
      }
    } else {
      result.push({ ...partialItem });
      baseKeyIndex.set(key, result.length - 1);
    }
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeObjects(
  base: Record<string, unknown>,
  partial: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base };
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    if (value === null) {
      delete result[key];
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function mergeProfile(
  base: MasterProfile,
  partial: DeepPartial<MasterProfile>
): MasterProfile {
  const merged: Record<string, unknown> = JSON.parse(JSON.stringify(base));

  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;

    if (value === null) {
      delete merged[key];
      continue;
    }

    if (Array.isArray(value) && ARRAY_IDENTITY_KEYS[key]) {
      merged[key] = mergeArrays(
        (merged[key] as Record<string, unknown>[]) ?? [],
        value as Record<string, unknown>[],
        ARRAY_IDENTITY_KEYS[key]
      );
      continue;
    }

    // Deep-merge plain objects (address, links, preferences, etc.)
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeObjects(
        merged[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
      continue;
    }

    merged[key] = value;
  }

  // Validate merged result before returning
  try {
    return MasterProfileSchema.parse(merged);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ProfileValidationError(err);
    }
    throw err;
  }
}
