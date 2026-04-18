import { z } from 'zod';
import { MasterProfileSchema } from '../profile/schema';

export { MasterProfileSchema };
export type MasterProfile = z.infer<typeof MasterProfileSchema>;

/** Enum of the six markdown sections a tailored resume contains. */
export const ResumeSectionEnum = z.enum([
  'header',
  'summary',
  'skills',
  'experience',
  'education',
  'projects',
]);
export type ResumeSection = z.infer<typeof ResumeSectionEnum>;

/** Markdown-keyed sections of a tailored resume artifact. */
export const TailoredResumeSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescriptionId: z.string().uuid(),
  header: z.string(),
  summary: z.string(),
  skills: z.string(),
  experience: z.string(),
  education: z.string(),
  projects: z.string(),
  updatedAt: z.string().datetime(),
});
export type TailoredResume = z.infer<typeof TailoredResumeSchema>;

/** Request to ingest a job description from a URL or pasted text. */
export const IngestJDRequestSchema = z.object({
  source: z.enum(['url', 'paste']),
  content: z.string().min(1),
});
export type IngestJDRequest = z.infer<typeof IngestJDRequestSchema>;

/** Response returned after a job description is ingested and parsed. */
export const IngestJDResponseSchema = z.object({
  jobDescriptionId: z.string().uuid(),
  title: z.string(),
  company: z.string(),
  parsedAt: z.string().datetime(),
});
export type IngestJDResponse = z.infer<typeof IngestJDResponseSchema>;

/** Request to generate a tailored resume from a JD and a profile snapshot. */
export const TailorRequestSchema = z.object({
  jobDescriptionId: z.string().uuid(),
  profileSnapshot: MasterProfileSchema,
});
export type TailorRequest = z.infer<typeof TailorRequestSchema>;

/** Response from the tailor step — the full tailored resume artifact. */
export const TailorResponseSchema = TailoredResumeSchema;
export type TailorResponse = TailoredResume;

/** Request to refine a single section of an existing tailored resume. */
export const RefineRequestSchema = z.object({
  resumeId: z.string().uuid(),
  section: ResumeSectionEnum,
  instruction: z.string().min(1).max(1000),
});
export type RefineRequest = z.infer<typeof RefineRequestSchema>;

/** Response from a section refine — updated markdown for that section. */
export const RefineResponseSchema = z.object({
  resumeId: z.string().uuid(),
  section: ResumeSectionEnum,
  updatedMarkdown: z.string(),
  updatedAt: z.string().datetime(),
});
export type RefineResponse = z.infer<typeof RefineResponseSchema>;
