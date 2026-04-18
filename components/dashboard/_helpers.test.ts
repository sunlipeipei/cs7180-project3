/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeProfileCompleteness, formatRelative } from './_helpers';
import type { MasterProfile } from '@/ai/schemas';

// --- helpers for building minimal profiles ---

function fullProfile(): MasterProfile {
  return {
    schemaVersion: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+15550001234',
    skills: [{ name: 'TypeScript' }],
    workExperience: [
      { company: 'Acme', title: 'Engineer', startDate: '2020-01-01', descriptions: [] },
    ],
    education: [{ school: 'MIT', degree: 'BS' }],
  };
}

// --- computeProfileCompleteness ---

describe('computeProfileCompleteness', () => {
  it('returns 100 when all required fields are filled', () => {
    expect(computeProfileCompleteness(fullProfile())).toBe(100);
  });

  it('returns 0 when all required fields are missing/empty', () => {
    const empty: MasterProfile = {
      schemaVersion: 1,
      name: '',
      email: '',
      phone: '',
      skills: [],
      workExperience: [],
      education: [],
    };
    expect(computeProfileCompleteness(empty)).toBe(0);
  });

  it('returns ~83 (5/6) when one required field is missing', () => {
    const profile = fullProfile();
    profile.phone = '';
    // 5 of 6 fields filled → Math.round(5/6 * 100) = 83
    expect(computeProfileCompleteness(profile)).toBe(83);
  });

  it('returns ~50 (3/6) when only name, email, phone are present', () => {
    const profile: MasterProfile = {
      schemaVersion: 1,
      name: 'Jane',
      email: 'jane@example.com',
      phone: '+15550001234',
      skills: [],
      workExperience: [],
      education: [],
    };
    expect(computeProfileCompleteness(profile)).toBe(50);
  });

  it('returns ~17 (1/6) when only name is filled', () => {
    const profile: MasterProfile = {
      schemaVersion: 1,
      name: 'Jane',
      email: '',
      phone: '',
      skills: [],
      workExperience: [],
      education: [],
    };
    expect(computeProfileCompleteness(profile)).toBe(17);
  });

  it('treats whitespace-only name as empty', () => {
    const profile = fullProfile();
    profile.name = '   ';
    expect(computeProfileCompleteness(profile)).toBe(83);
  });
});

// --- formatRelative ---

describe('formatRelative', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function mockNow(isoDate: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(isoDate));
  }

  it('returns "today" for same calendar day', () => {
    mockNow('2025-04-10T15:00:00Z');
    expect(formatRelative('2025-04-10T08:00:00.000Z')).toBe('today');
  });

  it('returns "yesterday" for previous calendar day', () => {
    mockNow('2025-04-10T15:00:00Z');
    expect(formatRelative('2025-04-09T20:00:00.000Z')).toBe('yesterday');
  });

  it('returns "N days ago" for 2 days back', () => {
    mockNow('2025-04-10T15:00:00Z');
    expect(formatRelative('2025-04-08T10:00:00.000Z')).toBe('2 days ago');
  });

  it('returns "7 days ago" for 7 days back', () => {
    mockNow('2025-04-10T15:00:00Z');
    expect(formatRelative('2025-04-03T10:00:00.000Z')).toBe('7 days ago');
  });

  it('returns locale date string for dates more than 7 days ago', () => {
    mockNow('2025-04-10T15:00:00Z');
    const isoDate = '2025-03-15T10:30:00.000Z';
    const result = formatRelative(isoDate);
    // Should be a locale date string, not "N days ago"
    expect(result).not.toMatch(/days ago/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles future dates gracefully (returns locale string)', () => {
    mockNow('2025-04-10T15:00:00Z');
    const result = formatRelative('2025-04-20T10:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
