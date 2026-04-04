import { describe, it, expect } from 'vitest';
import { MasterProfileSchema } from '../schema.js';
import sampleProfile from './fixtures/sample-profile.json';
import invalidProfile from './fixtures/invalid-profile.json';

describe('MasterProfileSchema', () => {
  describe('valid profiles', () => {
    it('should accept a complete valid profile', () => {
      const result = MasterProfileSchema.safeParse(sampleProfile);
      expect(result.success).toBe(true);
    });

    it('should accept a minimal valid profile (only required fields)', () => {
      const minimal = {
        schemaVersion: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        skills: [],
        workExperience: [],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('should accept profile with empty optional arrays', () => {
      const profile = {
        schemaVersion: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0100',
        skills: [{ name: 'TypeScript' }],
        workExperience: [],
        education: [],
        projects: [],
        certifications: [],
      };
      const result = MasterProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe('required field validation', () => {
    it('should reject profile missing email', () => {
      const result = MasterProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join('.'));
        expect(paths).toContain('email');
      }
    });

    it('should reject profile missing name', () => {
      const noName = {
        schemaVersion: 1,
        email: 'a@b.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(noName);
      expect(result.success).toBe(false);
    });

    it('should reject profile missing schemaVersion', () => {
      const noVersion = {
        name: 'J',
        email: 'a@b.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(noVersion);
      expect(result.success).toBe(false);
    });

    it('should reject profile missing skills array', () => {
      const noSkills = {
        schemaVersion: 1,
        name: 'J',
        email: 'a@b.com',
        phone: '555',
        workExperience: [],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(noSkills);
      expect(result.success).toBe(false);
    });
  });

  describe('email validation', () => {
    it('should reject invalid email format', () => {
      const badEmail = {
        schemaVersion: 1,
        name: 'John',
        email: 'not-an-email',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(badEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('nested type validation', () => {
    it('should reject work experience missing required fields', () => {
      const badWork = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [{ company: 'Acme' }], // missing title and startDate
        education: [],
      };
      const result = MasterProfileSchema.safeParse(badWork);
      expect(result.success).toBe(false);
    });

    it('should reject education missing required fields', () => {
      const badEdu = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [{ school: 'MIT' }], // missing degree
      };
      const result = MasterProfileSchema.safeParse(badEdu);
      expect(result.success).toBe(false);
    });

    it('should reject skill missing name', () => {
      const badSkill = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [{ category: 'language' }], // missing name
        workExperience: [],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(badSkill);
      expect(result.success).toBe(false);
    });

    it('should reject project missing name', () => {
      const badProject = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [],
        projects: [{ description: 'Something' }], // missing name
      };
      const result = MasterProfileSchema.safeParse(badProject);
      expect(result.success).toBe(false);
    });

    it('should require city and country when address is provided', () => {
      const badAddress = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [],
        address: { street: '123 Main St' }, // missing city and country
      };
      const result = MasterProfileSchema.safeParse(badAddress);
      expect(result.success).toBe(false);
    });
  });

  describe('date format validation', () => {
    it('should accept ISO 8601 date strings', () => {
      const profile = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [
          {
            company: 'Acme',
            title: 'Engineer',
            startDate: '2021-06-01',
            endDate: null,
            descriptions: [],
          },
        ],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should accept null endDate for current positions', () => {
      const profile = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [
          {
            company: 'Acme',
            title: 'Engineer',
            startDate: '2021-06-01',
            endDate: null,
            descriptions: ['Did things'],
          },
        ],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should reject non-ISO date strings like "banana"', () => {
      const profile = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [
          {
            company: 'Acme',
            title: 'Engineer',
            startDate: 'banana',
            descriptions: [],
          },
        ],
        education: [],
      };
      const result = MasterProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date strings in education', () => {
      const profile = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [{ school: 'MIT', degree: 'B.S.', startDate: 'not-a-date' }],
      };
      const result = MasterProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date strings in projects', () => {
      const profile = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [],
        projects: [{ name: 'Proj', startDate: 'yesterday' }],
      };
      const result = MasterProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date strings in certifications', () => {
      const profile = {
        schemaVersion: 1,
        name: 'John',
        email: 'john@test.com',
        phone: '555',
        skills: [],
        workExperience: [],
        education: [],
        certifications: [{ name: 'Cert', date: 'xyz' }],
      };
      const result = MasterProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });
  });
});
