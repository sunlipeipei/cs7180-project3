// Public API for the profile module
export type {
  MasterProfile,
  Address,
  Links,
  Skill,
  WorkExperience,
  Education,
  Project,
  Certification,
  ContextSources,
  Preferences,
  SalaryRange,
} from './types';

export {
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
} from './schema';

export { loadProfile, saveProfile } from './profileManager';
export { mergeProfile } from './mergeProfile';
export { ProfileValidationError, ProfileNotFoundError, ProfileIOError } from './errors';
