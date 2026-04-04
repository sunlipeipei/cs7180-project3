import { describe, it, expect } from 'vitest';
import { mergeProfile } from '../mergeProfile.js';
import { ProfileValidationError } from '../errors.js';
import type { MasterProfile } from '../types.js';

function makeBaseProfile(overrides: Partial<MasterProfile> = {}): MasterProfile {
  return {
    schemaVersion: 1,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    skills: [
      { name: 'TypeScript', category: 'language', level: 'expert' },
      { name: 'React', category: 'framework', level: 'proficient' },
    ],
    workExperience: [
      {
        company: 'Acme',
        title: 'Engineer',
        startDate: '2021-01-01',
        endDate: null,
        descriptions: ['Built stuff'],
      },
    ],
    education: [{ school: 'MIT', degree: 'B.S.' }],
    ...overrides,
  };
}

describe('mergeProfile', () => {
  describe('scalar fields', () => {
    it('should overwrite scalar fields with partial values (last-write-wins)', () => {
      const base = makeBaseProfile();
      const partial = { name: 'John Smith', phone: '555-9999' };

      const merged = mergeProfile(base, partial);

      expect(merged.name).toBe('John Smith');
      expect(merged.phone).toBe('555-9999');
      expect(merged.email).toBe('jane@example.com'); // unchanged
    });

    it('should skip fields that are undefined in partial', () => {
      const base = makeBaseProfile({ summary: 'Original summary' });
      const partial = { name: 'Updated Name', summary: undefined };

      const merged = mergeProfile(base, partial);

      expect(merged.name).toBe('Updated Name');
      expect(merged.summary).toBe('Original summary');
    });

    it('should clear fields when partial value is null', () => {
      const base = makeBaseProfile({ summary: 'Original summary' });
      const partial = { summary: null as any };

      const merged = mergeProfile(base, partial);

      expect(merged.summary).toBeUndefined();
    });
  });

  describe('skills array merge', () => {
    it('should deduplicate skills by name and update matching entries', () => {
      const base = makeBaseProfile();
      const partial = {
        skills: [{ name: 'TypeScript', level: 'proficient' }],
      };

      const merged = mergeProfile(base, partial);

      const ts = merged.skills.find((s) => s.name === 'TypeScript');
      expect(ts?.level).toBe('proficient'); // updated
      expect(ts?.category).toBe('language'); // preserved from base
      expect(merged.skills.filter((s) => s.name === 'TypeScript')).toHaveLength(1);
    });

    it('should append new skills that do not exist in base', () => {
      const base = makeBaseProfile();
      const partial = {
        skills: [{ name: 'Go', category: 'language' }],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.skills).toHaveLength(3); // 2 original + 1 new
      expect(merged.skills.find((s) => s.name === 'Go')).toBeDefined();
    });
  });

  describe('workExperience array merge', () => {
    it('should deduplicate by company + title + startDate', () => {
      const base = makeBaseProfile();
      const partial = {
        workExperience: [
          {
            company: 'Acme',
            title: 'Engineer',
            startDate: '2021-01-01',
            location: 'Remote',
          },
        ],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.workExperience).toHaveLength(1);
      expect(merged.workExperience[0].location).toBe('Remote');
      expect(merged.workExperience[0].descriptions).toEqual(['Built stuff']);
    });

    it('should replace descriptions array on matched workExperience', () => {
      const base = makeBaseProfile();
      const partial = {
        workExperience: [
          {
            company: 'Acme',
            title: 'Engineer',
            startDate: '2021-01-01',
            descriptions: ['New bullet 1', 'New bullet 2'],
          },
        ],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.workExperience[0].descriptions).toEqual(['New bullet 1', 'New bullet 2']);
    });

    it('should append new work experience entries', () => {
      const base = makeBaseProfile();
      const partial = {
        workExperience: [
          {
            company: 'NewCo',
            title: 'Senior Engineer',
            startDate: '2023-06-01',
            descriptions: ['Led team'],
          },
        ],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.workExperience).toHaveLength(2);
    });
  });

  describe('education array merge', () => {
    it('should deduplicate by school + degree', () => {
      const base = makeBaseProfile();
      const partial = {
        education: [{ school: 'MIT', degree: 'B.S.', gpa: '3.9' }],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.education).toHaveLength(1);
      expect(merged.education[0].gpa).toBe('3.9');
    });

    it('should append new education entries', () => {
      const base = makeBaseProfile();
      const partial = {
        education: [{ school: 'Stanford', degree: 'M.S.' }],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.education).toHaveLength(2);
    });
  });

  describe('projects array merge', () => {
    it('should deduplicate projects by name', () => {
      const base = makeBaseProfile({
        projects: [{ name: 'CLI Tool', description: 'Old desc', technologies: ['Node.js'] }],
      });
      const partial = {
        projects: [{ name: 'CLI Tool', description: 'New desc', technologies: [] }],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.projects).toHaveLength(1);
      expect(merged.projects![0].description).toBe('New desc');
      expect(merged.projects![0].technologies).toEqual(['Node.js']);
    });
  });

  describe('certifications array merge', () => {
    it('should deduplicate certifications by name + issuer', () => {
      const base = makeBaseProfile({
        certifications: [{ name: 'AWS SA', issuer: 'AWS', date: '2023-01-01' }],
      });
      const partial = {
        certifications: [{ name: 'AWS SA', issuer: 'AWS', date: '2024-01-01' }],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.certifications).toHaveLength(1);
      expect(merged.certifications![0].date).toBe('2024-01-01');
    });
  });

  describe('preserves array order', () => {
    it('should preserve order of existing items and append new ones at end', () => {
      const base = makeBaseProfile({
        skills: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      });
      const partial = {
        skills: [{ name: 'B', level: 'expert' }, { name: 'D' }],
      };

      const merged = mergeProfile(base, partial);

      expect(merged.skills.map((s) => s.name)).toEqual(['A', 'B', 'C', 'D']);
      expect(merged.skills[1].level).toBe('expert');
    });
  });

  describe('edge cases', () => {
    it('should return a new object (not mutate base)', () => {
      const base = makeBaseProfile();
      const partial = { name: 'Changed' };

      const merged = mergeProfile(base, partial);

      expect(merged.name).toBe('Changed');
      expect(base.name).toBe('Jane Doe'); // original unchanged
    });

    it('should handle empty partial (no changes)', () => {
      const base = makeBaseProfile();
      const merged = mergeProfile(base, {});

      expect(merged).toEqual(base);
    });
  });

  describe('nested object merge', () => {
    it('should deep-merge address (not replace entire object)', () => {
      const base = makeBaseProfile({
        address: { city: 'San Francisco', state: 'CA', country: 'US' },
      });
      const partial = { address: { city: 'NYC', country: 'US' } };

      const merged = mergeProfile(base, partial);

      expect(merged.address?.city).toBe('NYC');
      expect(merged.address?.state).toBe('CA'); // preserved, not wiped
      expect(merged.address?.country).toBe('US'); // preserved, not wiped
    });

    it('should deep-merge links (not replace entire object)', () => {
      const base = makeBaseProfile({
        links: { github: 'https://github.com/jane', linkedin: 'https://linkedin.com/in/jane' },
      });
      const partial = { links: { github: 'https://github.com/jane-new' } };

      const merged = mergeProfile(base, partial);

      expect(merged.links?.github).toBe('https://github.com/jane-new');
      expect(merged.links?.linkedin).toBe('https://linkedin.com/in/jane'); // preserved
    });

    it('should deep-merge preferences (not replace entire object)', () => {
      const base = makeBaseProfile({
        preferences: {
          workAuthorization: 'US Citizen',
          willingToRelocate: true,
          yearsOfExperience: 5,
        },
      });
      const partial = { preferences: { yearsOfExperience: 6 } };

      const merged = mergeProfile(base, partial);

      expect(merged.preferences?.yearsOfExperience).toBe(6);
      expect(merged.preferences?.workAuthorization).toBe('US Citizen'); // preserved
      expect(merged.preferences?.willingToRelocate).toBe(true); // preserved
    });
  });

  describe('post-merge validation', () => {
    it('should throw ProfileValidationError when merge produces invalid profile (null required field)', () => {
      const base = makeBaseProfile();
      const partial = { name: null as any }; // name is required

      expect(() => mergeProfile(base, partial)).toThrow(ProfileValidationError);
    });

    it('should throw ProfileValidationError when merge produces invalid email', () => {
      const base = makeBaseProfile();
      const partial = { email: 'not-an-email' };

      expect(() => mergeProfile(base, partial)).toThrow(ProfileValidationError);
    });
  });
});
