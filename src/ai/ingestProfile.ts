import { zodResponseFormat } from 'openai/helpers/zod';
import { getClient, getModel } from './client';
import { INGEST_PROFILE_SYSTEM_PROMPT, buildIngestProfileUserMessage } from './prompts';
import { MasterProfileSchema, type MasterProfile } from './schemas';

/**
 * Call the configured OpenRouter model to convert raw resume text into a
 * validated MasterProfile. Throws if the model response cannot be coerced
 * into the schema — callers map to HTTP 502.
 */
export async function ingestProfileFromText(resumeText: string): Promise<MasterProfile> {
  const client = getClient();
  const model = getModel();

  const completion = await client.chat.completions.parse({
    model,
    messages: [
      { role: 'system', content: INGEST_PROFILE_SYSTEM_PROMPT },
      { role: 'user', content: buildIngestProfileUserMessage(resumeText) },
    ],
    response_format: zodResponseFormat(MasterProfileSchema, 'master_profile'),
  });

  const usage = completion.usage;
  console.info('[ai.ingestProfile]', {
    model,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) {
    throw new Error('Model returned no parsed profile');
  }

  // Helper already validates with Zod, but re-parse so the result's type is
  // the canonical MasterProfile inferred from our schema (defensive).
  return MasterProfileSchema.parse(parsed);
}
