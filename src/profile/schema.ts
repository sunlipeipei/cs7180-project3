import { z } from 'zod';

// ISO 8601 date string (YYYY-MM-DD)
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO 8601 date (YYYY-MM-DD)');

// --- Sub-schemas ---

export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string(),
});

export const LinksSchema = z.object({
  github: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  other: z.record(z.string()).optional(),
});

export const SkillSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  level: z.string().optional(),
});

export const WorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: isoDateString,
  endDate: isoDateString.nullable().optional(),
  location: z.string().optional(),
  descriptions: z.array(z.string()).default([]),
});

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional(),
  startDate: isoDateString.optional(),
  endDate: isoDateString.optional(),
  gpa: z.string().optional(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  url: z.string().optional(),
  startDate: isoDateString.optional(),
  endDate: isoDateString.optional(),
  role: z.string().optional(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  date: isoDateString.optional(),
  expirationDate: isoDateString.optional(),
  credentialId: z.string().optional(),
});

export const ContextSourcesSchema = z.object({
  githubRepos: z.array(z.string()).default([]),
  documentPaths: z.array(z.string()).default([]),
});

export const SalaryRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  currency: z.string(),
});

export const PreferencesSchema = z.object({
  salaryRange: SalaryRangeSchema.optional(),
  workAuthorization: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
  yearsOfExperience: z.number().optional(),
  careerSummary: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  preferredIndustries: z.array(z.string()).optional(),
});

// --- Master Profile ---

export const MasterProfileSchema = z.object({
  schemaVersion: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: AddressSchema.optional(),
  links: LinksSchema.optional(),
  summary: z.string().optional(),
  skills: z.array(SkillSchema),
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
  resumeTemplatePath: z.string().optional(),
  contextSources: ContextSourcesSchema.optional(),
  preferences: PreferencesSchema.optional(),
});
