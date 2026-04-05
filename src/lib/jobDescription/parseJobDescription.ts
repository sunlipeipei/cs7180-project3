import * as cheerio from 'cheerio';
import type { ParsedJobDescription } from './types';

const MAX_LENGTH = 50000;

function validateUrl(input: string): void {
  try {
    const url = new URL(input);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid URL: only http and https schemes are allowed');
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Invalid URL')) throw e;
    throw new Error('Invalid URL');
  }
}

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $('nav, footer, header, script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

export async function parseJobDescription(input: string): Promise<ParsedJobDescription> {
  const trimmed = input.trim();

  // Detect URL vs plain text
  if (trimmed.includes('://')) {
    validateUrl(trimmed);

    let response: Response;
    try {
      response = await fetch(trimmed, {
        headers: { 'User-Agent': 'BypassHire/1.0' },
      });
    } catch (e) {
      throw new Error(`Failed to fetch job description: ${(e as Error).message}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch job description: HTTP ${response.status}`);
    }

    const html = await response.text();
    const rawText = extractTextFromHtml(html);

    if (!rawText) {
      throw new Error('Job description cannot be empty');
    }

    if (rawText.length > MAX_LENGTH) {
      throw new Error('Job description is too long (max 50,000 characters)');
    }

    return { type: 'url', rawText, sourceUrl: trimmed };
  }

  // Plain text path
  if (!trimmed) {
    throw new Error('Job description cannot be empty');
  }

  if (trimmed.length > MAX_LENGTH) {
    throw new Error('Job description is too long (max 50,000 characters)');
  }

  return { type: 'text', rawText: trimmed };
}
