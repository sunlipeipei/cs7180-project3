import { z } from 'zod';
import {
  MasterProfileSchema,
  AddressSchema,
  LinksSchema,
  SkillSchema,
  WorkExperienceSchema,
  EducationSchema,
  ProjectSchema,
  CertificationSchema,
  ContextSourcesSchema,
  PreferencesSchema,
  SalaryRangeSchema,
} from './schema.js';

export type MasterProfile = z.infer<typeof MasterProfileSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Links = z.infer<typeof LinksSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type ContextSources = z.infer<typeof ContextSourcesSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type SalaryRange = z.infer<typeof SalaryRangeSchema>;
