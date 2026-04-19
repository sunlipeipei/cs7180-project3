import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IngestJDResponseSchema } from '@/ai/schemas';
import { listJobDescriptions, getJobDescription, createJD } from '../jobDescription.service';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mockFetch);
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function rawRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ckjd1234567890abc',
    userId: 'user-1',
    content: 'Senior SWE at Acme Corp\n\nFull details...',
    sourceUrl: null,
    title: null,
    company: null,
    createdAt: '2026-04-18T00:00:00.000Z',
    updatedAt: '2026-04-18T00:00:00.000Z',
    ...overrides,
  };
}

describe('listJobDescriptions', () => {
  it('maps raw rows (direct array response) into IngestJDResponse[]', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, [rawRow()]));
    const list = await listJobDescriptions();
    expect(list).toHaveLength(1);
    expect(IngestJDResponseSchema.safeParse(list[0]).success).toBe(true);
  });

  it('also accepts { jds: [...] } envelope shape', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { jds: [rawRow()] }));
    const list = await listJobDescriptions();
    expect(list).toHaveLength(1);
  });

  it('derives title from the first non-empty line when DB title is null', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, [rawRow({ content: '\n\nStaff Platform Engineer\n\nBody…', title: null })])
    );
    const [jd] = await listJobDescriptions();
    expect(jd.title).toBe('Staff Platform Engineer');
  });

  it('falls back to "Unknown" for company when DB value is null', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, [rawRow({ company: null })]));
    const [jd] = await listJobDescriptions();
    expect(jd.company).toBe('Unknown');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(500, { error: 'boom' }));
    await expect(listJobDescriptions()).rejects.toThrow(/500/);
  });
});

describe('getJobDescription', () => {
  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, { error: 'missing' }));
    const r = await getJobDescription('ck1');
    expect(r).toBeNull();
  });

  it('URL-encodes the id and returns the mapped row on 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, rawRow()));
    const r = await getJobDescription('a b/c');
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/job-descriptions/a%20b%2Fc');
    expect(r?.jobDescriptionId).toBe('ckjd1234567890abc');
  });

  it('handles the { jd } envelope shape', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { jd: rawRow() }));
    const r = await getJobDescription('ckjd1234567890abc');
    expect(r?.jobDescriptionId).toBe('ckjd1234567890abc');
  });
});

describe('createJD', () => {
  it('Zod-validates the body before sending (empty content throws, no fetch)', async () => {
    await expect(createJD({ source: 'paste', content: '' })).rejects.toThrow();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('POSTs { input, source } to /api/job-descriptions and maps the raw response', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(201, rawRow()));
    const r = await createJD({ source: 'paste', content: 'Senior SWE\n\nDetails.' });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/job-descriptions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      input: 'Senior SWE\n\nDetails.',
      source: 'paste',
    });
    expect(r.jobDescriptionId).toBe('ckjd1234567890abc');
  });

  it('forwards source="url" in the POST body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(201, rawRow()));
    await createJD({ source: 'url', content: 'https://example.com/jobs/1' });
    const [, init] = mockFetch.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({
      input: 'https://example.com/jobs/1',
      source: 'url',
    });
  });

  it('surfaces the server error message on failure', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(422, { error: 'parse failed' }));
    await expect(createJD({ source: 'paste', content: 'some content' })).rejects.toThrow(
      /parse failed/
    );
  });
});
