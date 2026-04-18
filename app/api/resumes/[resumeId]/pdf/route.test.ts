import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
}));
vi.mock('../../../../../src/lib/resumeRepository', () => ({
  getResume: vi.fn(),
}));
vi.mock('../../../../../src/pdf/render', () => ({
  renderResumeToPdf: vi.fn(),
}));

import { getAuth } from '../../../../../src/lib/auth';
import { getResume } from '../../../../../src/lib/resumeRepository';
import { renderResumeToPdf } from '../../../../../src/pdf/render';
import { resumesFixture } from '../../../../../src/fixtures/index';
import { GET } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockGet = getResume as unknown as ReturnType<typeof vi.fn>;
const mockRender = renderResumeToPdf as unknown as ReturnType<typeof vi.fn>;

const RESUME = resumesFixture[0];

function paramsFor(id: string): { params: Promise<{ resumeId: string }> } {
  return { params: Promise.resolve({ resumeId: id }) };
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/resumes/[resumeId]/pdf', () => {
  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const res = await GET(
      new Request(`http://localhost/api/resumes/${RESUME.resumeId}/pdf`),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 when resume not found (cross-user or missing)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(null);
    const res = await GET(
      new Request(`http://localhost/api/resumes/${RESUME.resumeId}/pdf`),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(404);
    expect(mockGet).toHaveBeenCalledWith(RESUME.resumeId, 'user-1');
    expect(mockRender).not.toHaveBeenCalled();
  });

  it('returns 500 on render failure (internals logged, not leaked)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(RESUME);
    mockRender.mockRejectedValue(new Error('font not found at /private/path'));
    const res = await GET(
      new Request(`http://localhost/api/resumes/${RESUME.resumeId}/pdf`),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to render PDF');
    expect(body.error).not.toMatch(/font|path|private/);
  });

  it('returns a 200 application/pdf attachment on success', async () => {
    const fakeBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGet.mockResolvedValue(RESUME);
    mockRender.mockResolvedValue(fakeBytes);

    const res = await GET(
      new Request(`http://localhost/api/resumes/${RESUME.resumeId}/pdf`),
      paramsFor(RESUME.resumeId)
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toMatch(/attachment; filename="resume-/);
    expect(res.headers.get('cache-control')).toBe('no-store');

    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf.byteLength).toBe(fakeBytes.byteLength);
    const head = Buffer.from(buf.slice(0, 5)).toString('ascii');
    expect(head).toBe('%PDF-');
  });
});
