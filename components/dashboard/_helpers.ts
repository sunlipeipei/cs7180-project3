import type { MasterProfile } from '@/ai/schemas';

/**
 * Computes a 0-100 integer representing how complete the required fields of
 * a MasterProfile are. The required set is explicitly enumerated here:
 * fullName/name, email, phone, skills (non-empty), experience (non-empty),
 * education (non-empty).
 */
export function computeProfileCompleteness(profile: MasterProfile): number {
  const checks: boolean[] = [
    typeof profile.name === 'string' && profile.name.trim().length > 0,
    typeof profile.email === 'string' && profile.email.trim().length > 0,
    typeof profile.phone === 'string' && profile.phone.trim().length > 0,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Array.isArray(profile.workExperience) && profile.workExperience.length > 0,
    Array.isArray(profile.education) && profile.education.length > 0,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

/**
 * Returns a human-friendly relative time string from an ISO 8601 date string.
 * - "today" if the date is the same calendar day as now
 * - "yesterday" for the previous calendar day
 * - "N days ago" for 2–7 days back
 * - toLocaleDateString() for anything older
 * No external dependencies.
 */
export function formatRelative(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);

  // Normalise both to midnight local time for day-level comparison
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = nowDay.getTime() - dateDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays >= 2 && diffDays <= 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
