import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock safeFetch so parseJobDescription tests remain isolated from SSRF logic
vi.mock('../safeFetch', () => ({
  safeFetch: vi.fn(),
}));

import { safeFetch } from '../safeFetch';
import { parseJobDescription } from '../parseJobDescription';

const mockSafeFetch = safeFetch as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('parseJobDescription — text input', () => {
  it('returns structured result for plain text input', async () => {
    const text = 'We are looking for a Senior Software Engineer with 5+ years of experience.';
    const result = await parseJobDescription(text);

    expect(result.type).toBe('text');
    expect(result.rawText).toBe(text);
    expect(result.sourceUrl).toBeUndefined();
  });

  it('trims whitespace from text input', async () => {
    const result = await parseJobDescription('  Software Engineer role  ');
    expect(result.rawText).toBe('Software Engineer role');
  });

  it('throws when text input is empty', async () => {
    await expect(parseJobDescription('')).rejects.toThrow('Job description cannot be empty');
  });

  it('throws when text input is only whitespace', async () => {
    await expect(parseJobDescription('   ')).rejects.toThrow('Job description cannot be empty');
  });

  it('throws when text exceeds maximum length', async () => {
    const tooLong = 'a'.repeat(50001);
    await expect(parseJobDescription(tooLong)).rejects.toThrow('Job description is too long');
  });

  it('accepts text at the maximum allowed length', async () => {
    const maxLength = 'a'.repeat(50000);
    const result = await parseJobDescription(maxLength);
    expect(result.type).toBe('text');
  });
});

describe('parseJobDescription — URL input', () => {
  const mockHtml = `
    <html>
      <body>
        <nav>Navigation links</nav>
        <main>
          <h1>Senior Software Engineer</h1>
          <p>We are looking for an experienced engineer to join our team.</p>
          <ul>
            <li>5+ years of TypeScript experience</li>
            <li>Strong understanding of React</li>
          </ul>
        </main>
        <footer>Footer content</footer>
      </body>
    </html>
  `;

  beforeEach(() => {
    mockSafeFetch.mockResolvedValue({
      body: mockHtml,
      finalUrl: 'https://example.com/jobs/123',
    });
  });

  it('fetches and parses HTML from a URL', async () => {
    const result = await parseJobDescription('https://example.com/jobs/123');

    expect(mockSafeFetch).toHaveBeenCalledWith('https://example.com/jobs/123');
    expect(result.type).toBe('url');
    expect(result.sourceUrl).toBe('https://example.com/jobs/123');
    expect(result.rawText).toContain('Senior Software Engineer');
    expect(result.rawText).toContain('TypeScript');
  });

  it('strips nav and footer boilerplate from fetched HTML', async () => {
    const result = await parseJobDescription('https://example.com/jobs/123');

    expect(result.rawText).not.toContain('Navigation links');
    expect(result.rawText).not.toContain('Footer content');
  });

  it('throws when safeFetch throws a network error', async () => {
    mockSafeFetch.mockRejectedValue(new Error('Network error'));

    await expect(parseJobDescription('https://example.com/jobs/123')).rejects.toThrow(
      'Network error'
    );
  });

  it('throws when parsed URL content is empty', async () => {
    mockSafeFetch.mockResolvedValue({
      body: '<html><body></body></html>',
      finalUrl: 'https://example.com/empty',
    });

    await expect(parseJobDescription('https://example.com/empty')).rejects.toThrow(
      'Job description cannot be empty'
    );
  });

  it('rejects non-http/https URL schemes (safeFetch propagates the error)', async () => {
    mockSafeFetch.mockRejectedValue(
      new Error('Invalid URL scheme: only http and https are allowed, got "ftp:"')
    );

    await expect(parseJobDescription('ftp://example.com/jobs/123')).rejects.toThrow(
      /scheme|Invalid URL/i
    );
  });

  it('accepts http:// URLs', async () => {
    mockSafeFetch.mockResolvedValue({
      body: mockHtml,
      finalUrl: 'http://example.com/jobs/123',
    });

    const result = await parseJobDescription('http://example.com/jobs/123');
    expect(result.type).toBe('url');
  });

  it('uses the finalUrl from safeFetch as sourceUrl', async () => {
    // After a redirect, finalUrl may differ from the original
    mockSafeFetch.mockResolvedValue({
      body: mockHtml,
      finalUrl: 'https://example.com/jobs/canonical',
    });

    const result = await parseJobDescription('https://example.com/jobs/redirect');
    expect(result.sourceUrl).toBe('https://example.com/jobs/canonical');
  });
});
