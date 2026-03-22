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
} from './types.js';

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
} from './schema.js';

export { loadProfile, saveProfile } from './profileManager.js';
export { mergeProfile } from './mergeProfile.js';
export {
  ProfileValidationError,
  ProfileNotFoundError,
  ProfileIOError,
} from './errors.js';
