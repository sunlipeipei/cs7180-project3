import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadProfile, saveProfile } from '../profileManager.js';
import { ProfileNotFoundError, ProfileIOError, ProfileValidationError } from '../errors.js';
import sampleProfile from './fixtures/sample-profile.json';

const TEST_DIR = join(tmpdir(), 'bypasshire-test-' + process.pid);

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('loadProfile', () => {
  it('should load and return a valid profile from a JSON file', async () => {
    const filePath = join(TEST_DIR, 'profile.json');
    writeFileSync(filePath, JSON.stringify(sampleProfile));

    const profile = await loadProfile(filePath);
    expect(profile.name).toBe('Jane Doe');
    expect(profile.email).toBe('jane.doe@example.com');
    expect(profile.skills).toHaveLength(4);
    expect(profile.workExperience).toHaveLength(2);
  });

  it('should throw ProfileNotFoundError for missing file', async () => {
    await expect(loadProfile(join(TEST_DIR, 'nonexistent.json'))).rejects.toThrow(
      ProfileNotFoundError,
    );
  });

  it('should throw ProfileIOError for malformed JSON', async () => {
    const filePath = join(TEST_DIR, 'bad.json');
    writeFileSync(filePath, '{ broken json !!!');

    await expect(loadProfile(filePath)).rejects.toThrow(ProfileIOError);
  });

  it('should throw ProfileValidationError for valid JSON with wrong schema', async () => {
    const filePath = join(TEST_DIR, 'wrong-schema.json');
    writeFileSync(filePath, JSON.stringify({ foo: 'bar' }));

    await expect(loadProfile(filePath)).rejects.toThrow(ProfileValidationError);
  });

  it('should throw ProfileIOError for empty file', async () => {
    const filePath = join(TEST_DIR, 'empty.json');
    writeFileSync(filePath, '');

    await expect(loadProfile(filePath)).rejects.toThrow(ProfileIOError);
  });
});

describe('saveProfile', () => {
  it('should write valid JSON to the given path', async () => {
    const filePath = join(TEST_DIR, 'out.json');
    const profile = { ...sampleProfile };

    await saveProfile(profile as any, filePath);

    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.name).toBe('Jane Doe');
    // Should be pretty-printed
    expect(raw).toContain('\n');
  });

  it('should create parent directories if they do not exist', async () => {
    const nestedPath = join(TEST_DIR, 'a', 'b', 'c', 'profile.json');

    await saveProfile(sampleProfile as any, nestedPath);

    expect(existsSync(nestedPath)).toBe(true);
  });

  it('should validate before writing and throw ProfileValidationError for invalid data', async () => {
    const filePath = join(TEST_DIR, 'invalid-out.json');
    const invalid = { name: 'missing everything else' };

    await expect(saveProfile(invalid as any, filePath)).rejects.toThrow(ProfileValidationError);
    expect(existsSync(filePath)).toBe(false);
  });

  it('should throw ProfileIOError when writing to a read-only directory', async () => {
    const readOnlyDir = join(TEST_DIR, 'readonly');
    mkdirSync(readOnlyDir);
    chmodSync(readOnlyDir, 0o444);
    const filePath = join(readOnlyDir, 'nope', 'profile.json');

    try {
      await expect(saveProfile(sampleProfile as any, filePath)).rejects.toThrow(ProfileIOError);
    } finally {
      chmodSync(readOnlyDir, 0o755);
    }
  });

  it('should produce JSON that round-trips without data loss', async () => {
    const filePath = join(TEST_DIR, 'roundtrip.json');

    await saveProfile(sampleProfile as any, filePath);
    const loaded = await loadProfile(filePath);

    expect(loaded.name).toBe(sampleProfile.name);
    expect(loaded.email).toBe(sampleProfile.email);
    expect(loaded.skills).toHaveLength(sampleProfile.skills.length);
    expect(loaded.workExperience).toHaveLength(sampleProfile.workExperience.length);
    expect(loaded.education).toHaveLength(sampleProfile.education.length);
    expect(loaded.projects).toHaveLength(sampleProfile.projects!.length);
    expect(loaded.certifications).toHaveLength(sampleProfile.certifications!.length);
  });
});
