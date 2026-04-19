import { describe, it, expect, beforeEach, vi } from 'vitest';
import { profileFixture } from '@/fixtures/index';
import { getProfile, saveProfile, ingestProfilePdf } from '../profile.service';

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

describe('getProfile', () => {
  it('returns the parsed profile on 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { profile: profileFixture }));
    const profile = await getProfile();
    expect(profile?.name).toBe(profileFixture.name);
    expect(mockFetch).toHaveBeenCalledWith('/api/profile', { method: 'GET' });
  });

  it('returns null on 404', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(404, { error: 'Profile not found' }));
    const profile = await getProfile();
    expect(profile).toBeNull();
  });

  it('throws on 500', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(500, { error: 'boom' }));
    await expect(getProfile()).rejects.toThrow(/500/);
  });
});

describe('saveProfile', () => {
  it('validates locally and PUTs JSON body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { profile: profileFixture }));
    const saved = await saveProfile(profileFixture);
    expect(saved.name).toBe(profileFixture.name);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/profile');
    expect(init.method).toBe('PUT');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string).name).toBe(profileFixture.name);
  });

  it('throws on client-side Zod failure (no request sent)', async () => {
    const invalid = { ...profileFixture, email: 'not-an-email' };
    await expect(saveProfile(invalid)).rejects.toThrow();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('surfaces server error message on non-ok', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(400, { error: 'Invalid profile' }));
    await expect(saveProfile(profileFixture)).rejects.toThrow(/Invalid profile/);
  });
});

describe('ingestProfilePdf', () => {
  it('POSTs multipart with the file under "file" and returns the parsed profile', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { profile: profileFixture }));
    const file = new File([new Uint8Array(100)], 'resume.pdf', { type: 'application/pdf' });
    const profile = await ingestProfilePdf(file);
    expect(profile.name).toBe(profileFixture.name);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/profile/ingest');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBe(file);
  });

  it('surfaces 400 error message from the server', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(400, { error: 'Invalid PDF' }));
    const file = new File([new Uint8Array(10)], 'junk.pdf', { type: 'application/pdf' });
    await expect(ingestProfilePdf(file)).rejects.toThrow(/Invalid PDF/);
  });
});
