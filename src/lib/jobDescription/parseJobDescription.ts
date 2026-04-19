import * as cheerio from 'cheerio';
import type { ParsedJobDescription } from './types';
import { safeFetch } from './safeFetch';

const MAX_LENGTH = 50000;

export type JdSource = 'paste' | 'url';

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  $('nav, footer, header, script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

/**
 * Strict whole-string URL test for legacy callers that don't pass `source`.
 * Must be:
 *  - parseable by WHATWG `new URL()`
 *  - http or https protocol
 *  - no internal whitespace (rules out "paste JD with https://apply... in body")
 */
function isWholeStringHttpUrl(value: string): boolean {
  if (/\s/.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Parse a user-submitted job description.
 *
 * When `source` is provided (the UI toggle's explicit intent), routing is
 * authoritative — no heuristic is applied. When `source` is omitted (legacy
 * callers / direct API clients), the input is treated as a URL only if the
 * *entire* trimmed string is a valid http(s) URL. A pasted JD that happens
 * to mention `https://apply.example.com` in its body stays in the text path.
 *
 * See PR #60 comment 4274999164 for the regression this guards against.
 */
export async function parseJobDescription(
  input: string,
  source?: JdSource
): Promise<ParsedJobDescription> {
  const trimmed = input.trim();

  const routeToUrl = source === 'url' || (source === undefined && isWholeStringHttpUrl(trimmed));

  if (routeToUrl) {
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
