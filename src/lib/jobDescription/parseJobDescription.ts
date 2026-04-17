import * as cheerio from 'cheerio';
import type { ParsedJobDescription } from './types';
import { safeFetch } from './safeFetch';

const MAX_LENGTH = 50000;

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $('nav, footer, header, script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

export async function parseJobDescription(input: string): Promise<ParsedJobDescription> {
  const trimmed = input.trim();

  // Detect URL vs plain text
  if (trimmed.includes('://')) {
    const { body: html, finalUrl } = await safeFetch(trimmed);

    const rawText = extractTextFromHtml(html);

    if (!rawText) {
      throw new Error('Job description cannot be empty');
    }

    if (rawText.length > MAX_LENGTH) {
      throw new Error('Job description is too long (max 50,000 characters)');
    }

    return { type: 'url', rawText, sourceUrl: finalUrl };
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
