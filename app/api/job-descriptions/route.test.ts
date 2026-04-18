import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/lib/auth', () => ({
  getAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('../../../src/lib/jobDescription/parseJobDescription', () => ({
  parseJobDescription: vi.fn(),
}));

vi.mock('../../../src/lib/jobDescription/jobDescriptionRepository', () => ({
  saveJobDescription: vi.fn(),
  getJobDescriptionsByUser: vi.fn(),
}));

vi.mock('../../../src/lib/userRepository', () => ({
  upsertUser: vi.fn(),
}));

import { getAuth, getCurrentUser } from '../../../src/lib/auth';
import { parseJobDescription } from '../../../src/lib/jobDescription/parseJobDescription';
import {
  saveJobDescription,
  getJobDescriptionsByUser,
} from '../../../src/lib/jobDescription/jobDescriptionRepository';
import { upsertUser } from '../../../src/lib/userRepository';
import { POST, GET } from './route';

const mockAuth = getAuth as unknown as ReturnType<typeof vi.fn>;
const mockCurrentUser = getCurrentUser as unknown as ReturnType<typeof vi.fn>;
const mockParseJd = parseJobDescription as unknown as ReturnType<typeof vi.fn>;
const mockSaveJd = saveJobDescription as unknown as ReturnType<typeof vi.fn>;
const mockGetJds = getJobDescriptionsByUser as unknown as ReturnType<typeof vi.fn>;
const mockUpsertUser = upsertUser as unknown as ReturnType<typeof vi.fn>;

const BASE_URL = 'http://localhost/api/job-descriptions';

function makePostRequest(body: unknown): Request {
  return new Request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(): Request {
  return new Request(BASE_URL, { method: 'GET' });
}

const mockJd = {
  id: 'jd-1',
  userId: 'user-1',
  content: 'Engineer role',
  sourceUrl: null,
  title: null,
  company: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser.mockResolvedValue({
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  });
  mockUpsertUser.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

describe('POST /api/job-descriptions', () => {
  it('returns 401 JSON when userId is null', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makePostRequest({ input: 'some jd text' }));

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 500 JSON when auth() throws', async () => {
    mockAuth.mockRejectedValue(new Error('Clerk network error'));

    const res = await POST(makePostRequest({ input: 'some jd text' }));

    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toEqual({ error: 'Authentication error' });
  });

  it('returns 400 JSON for malformed JSON body', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON');
  });

  it('returns 400 JSON when Zod validation fails (empty input)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });

    const res = await POST(makePostRequest({ input: '' }));

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(typeof body.error).toBe('string');
  });

  it('returns 201 JSON on happy path', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockParseJd.mockResolvedValue({ type: 'text', rawText: 'Engineer role' });
    mockSaveJd.mockResolvedValue(mockJd);

    const res = await POST(makePostRequest({ input: 'Engineer role' }));

    expect(res.status).toBe(201);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.id).toBe('jd-1');
  });

  it('returns 500 JSON when ensureUser/DB upsert fails', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockUpsertUser.mockRejectedValue(new Error('DB connection failed'));

    const res = await POST(makePostRequest({ input: 'some jd text' }));

    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 422 JSON when parseJobDescription throws', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockParseJd.mockRejectedValue(new Error('Job description cannot be empty'));

    const res = await POST(makePostRequest({ input: 'some text' }));

    expect(res.status).toBe(422);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.error).toBe('Job description cannot be empty');
  });
});

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

describe('GET /api/job-descriptions', () => {
  it('returns 401 JSON when userId is null', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(makeGetRequest());

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 500 JSON when auth() throws', async () => {
    mockAuth.mockRejectedValue(new Error('Clerk SDK error'));

    const res = await GET(makeGetRequest());

    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body).toEqual({ error: 'Authentication error' });
  });

  it('returns 500 JSON when DB call throws', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetJds.mockRejectedValue(new Error('DB connection lost'));

    const res = await GET(makeGetRequest());

    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 200 JSON with JDs on happy path', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockGetJds.mockResolvedValue([mockJd]);

    const res = await GET(makeGetRequest());

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].id).toBe('jd-1');
  });
});
