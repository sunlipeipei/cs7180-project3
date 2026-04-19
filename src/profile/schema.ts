import { z } from 'zod';

// ISO 8601 date string (YYYY-MM-DD)
const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO 8601 date (YYYY-MM-DD)');

// --- Sub-schemas ---
//
// Every LLM-emitted optional field uses `.nullish()` (accepts `null`,
// `undefined`, or missing) because OpenRouter structured-output returns
// `null` for unknown optionals instead of omitting them. `.optional()`
// alone would reject `null` and fail MasterProfile validation on ingest.

export const AddressSchema = z.object({
  street: z.string().nullish(),
  city: z.string(),
  state: z.string().nullish(),
  zip: z.string().nullish(),
  country: z.string(),
});

export const LinksSchema = z.object({
  github: z.string().nullish(),
  linkedin: z.string().nullish(),
  portfolio: z.string().nullish(),
  other: z.record(z.string()).nullish(),
});

export const SkillSchema = z.object({
  name: z.string(),
  category: z.string().nullish(),
  level: z.string().nullish(),
});

export const WorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: isoDateString,
  // endDate = null is semantically meaningful ("currently employed"); keep
  // the existing nullable()+optional() contract rather than widening further.
  endDate: isoDateString.nullable().optional(),
  location: z.string().nullish(),
  descriptions: z.array(z.string()).default([]),
});

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().nullish(),
  startDate: isoDateString.nullish(),
  endDate: isoDateString.nullish(),
  gpa: z.string().nullish(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().nullish(),
  technologies: z.array(z.string()).default([]),
  url: z.string().nullish(),
  startDate: isoDateString.nullish(),
  endDate: isoDateString.nullish(),
  role: z.string().nullish(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullish(),
  date: isoDateString.nullish(),
  expirationDate: isoDateString.nullish(),
  credentialId: z.string().nullish(),
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
  salaryRange: SalaryRangeSchema.nullish(),
  workAuthorization: z.string().nullish(),
  willingToRelocate: z.boolean().nullish(),
  yearsOfExperience: z.number().nullish(),
  careerSummary: z.string().nullish(),
  targetRoles: z.array(z.string()).nullish(),
  preferredIndustries: z.array(z.string()).nullish(),
});

// --- Master Profile ---

export const MasterProfileSchema = z.object({
  schemaVersion: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: AddressSchema.nullish(),
  links: LinksSchema.nullish(),
  summary: z.string().nullish(),
  skills: z.array(SkillSchema),
  workExperience: z.array(WorkExperienceSchema),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema).nullish(),
  certifications: z.array(CertificationSchema).nullish(),
  resumeTemplatePath: z.string().nullish(),
  contextSources: ContextSourcesSchema.nullish(),
  preferences: PreferencesSchema.nullish(),
});
