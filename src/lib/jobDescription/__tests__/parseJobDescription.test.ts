import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { parseJobDescription } from '../parseJobDescription';

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
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    });
  });

  it('fetches and parses HTML from a URL', async () => {
    const result = await parseJobDescription('https://example.com/jobs/123');

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/jobs/123', expect.any(Object));
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

  it('throws when fetch returns a non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(parseJobDescription('https://example.com/jobs/404')).rejects.toThrow(
      'Failed to fetch job description'
    );
  });

  it('throws when fetch throws a network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(parseJobDescription('https://example.com/jobs/123')).rejects.toThrow();
  });

  it('throws when parsed URL content is empty', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><body></body></html>'),
    });

    await expect(parseJobDescription('https://example.com/empty')).rejects.toThrow(
      'Job description cannot be empty'
    );
  });

  it('rejects non-http/https URL schemes', async () => {
    await expect(parseJobDescription('ftp://example.com/jobs/123')).rejects.toThrow('Invalid URL');
  });

  it('accepts http:// URLs', async () => {
    const result = await parseJobDescription('http://example.com/jobs/123');
    expect(result.type).toBe('url');
  });
});
