import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (_client) return _client;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  _client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  });
  return _client;
}

export function getModel(): string {
  return process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.1';
}

// Exposed for tests to reset the memoised singleton between environments.
export function __resetClientForTests(): void {
  _client = null;
}
