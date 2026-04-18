import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('../../../../src/lib/userRepository', () => ({
  upsertUser: vi.fn(),
}));

vi.mock('../../../../src/ingestion/pdf', () => ({
  extractText: vi.fn(),
}));

vi.mock('../../../../src/ai/ingestProfile', () => ({
  ingestProfileFromText: vi.fn(),
}));

vi.mock('../../../../src/lib/profileRepository', () => ({
  saveProfile: vi.fn(),
}));

import { getAuth, getCurrentUser } from '../../../../src/lib/auth';
import { upsertUser } from '../../../../src/lib/userRepository';
import { extractText } from '../../../../src/ingestion/pdf';
import { ingestProfileFromText } from '../../../../src/ai/ingestProfile';
import { saveProfile } from '../../../../src/lib/profileRepository';
import { profileFixture } from '../../../../src/fixtures/index';
import { POST } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockCurrentUser = getCurrentUser as unknown as ReturnType<typeof vi.fn>;
const mockUpsertUser = upsertUser as unknown as ReturnType<typeof vi.fn>;
const mockExtractText = extractText as unknown as ReturnType<typeof vi.fn>;
const mockIngest = ingestProfileFromText as unknown as ReturnType<typeof vi.fn>;
const mockSaveProfile = saveProfile as unknown as ReturnType<typeof vi.fn>;

const URL = 'http://localhost/api/profile/ingest';

function makeMultipartRequest(
  file: File | null,
  extraFields: Record<string, string> = {}
): Request {
  const form = new FormData();
  if (file) form.set('file', file);
  for (const [k, v] of Object.entries(extraFields)) form.set(k, v);
  return new Request(URL, { method: 'POST', body: form });
}

function makePdfFile(bytes: number, name = 'resume.pdf', type = 'application/pdf'): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser.mockResolvedValue({
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  });
  mockUpsertUser.mockResolvedValue(undefined);
});

describe('POST /api/profile/ingest', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await POST(makeMultipartRequest(makePdfFile(10)));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 500 when auth throws', async () => {
    mockAuth.mockRejectedValue(new Error('Clerk error'));
    const res = await POST(makeMultipartRequest(makePdfFile(10)));
    expect(res.status).toBe(500);
  });

  it('returns 400 when body is not multipart', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(
      new Request(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"oops":true}',
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when file field is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const res = await POST(makeMultipartRequest(null));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Missing "file"/);
  });

  it('returns 413 when file exceeds 10 MB', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    // File with oversized byteLength — create via Blob with claimed size.
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', {
      type: 'application/pdf',
    });
    const res = await POST(makeMultipartRequest(oversized));
    expect(res.status).toBe(413);
  });

  it('returns 415 when file type is not PDF', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    const f = new File(['hello'], 'resume.txt', { type: 'text/plain' });
    const res = await POST(makeMultipartRequest(f));
    expect(res.status).toBe(415);
  });

  it('returns 400 when PDF parse fails (no stack leak)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockExtractText.mockRejectedValue(new Error('Invalid PDF: corrupt xref'));
    const res = await POST(makeMultipartRequest(makePdfFile(10)));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid PDF/);
    expect(body.stack).toBeUndefined();
  });

  it('returns 400 when PDF has no extractable text', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockExtractText.mockResolvedValue('   \n\n   ');
    const res = await POST(makeMultipartRequest(makePdfFile(10)));
    expect(res.status).toBe(400);
  });

  it('returns 502 when ingest AI call fails', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockExtractText.mockResolvedValue('Jordan Lee\nSoftware Engineer\n...');
    mockIngest.mockRejectedValue(new Error('Model returned no parsed profile'));
    const res = await POST(makeMultipartRequest(makePdfFile(10)));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Failed to parse resume');
  });

  it('returns 200 with parsed profile on happy path', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockExtractText.mockResolvedValue('Jordan Lee\nSoftware Engineer\n...');
    mockIngest.mockResolvedValue(profileFixture);
    mockSaveProfile.mockResolvedValue(undefined);

    const res = await POST(makeMultipartRequest(makePdfFile(10)));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.name).toBe(profileFixture.name);
    expect(mockSaveProfile).toHaveBeenCalledWith('user-1', profileFixture);
  });
});
