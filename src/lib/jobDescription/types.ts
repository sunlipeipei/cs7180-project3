import { z } from 'zod';

export const JobDescriptionInputSchema = z.string().trim().min(1).max(50000);

export const ParsedJobDescriptionSchema = z.object({
  type: z.enum(['text', 'url']),
  rawText: z.string().min(1).max(50000),
  sourceUrl: z.string().url().optional(),
});

export type ParsedJobDescription = z.infer<typeof ParsedJobDescriptionSchema>;
