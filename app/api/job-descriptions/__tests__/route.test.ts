import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn().mockResolvedValue({
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  }),
}));

vi.mock('../../../../src/lib/userRepository', () => ({
  upsertUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../src/lib/jobDescription/parseJobDescription', () => ({
  parseJobDescription: vi.fn(),
}));

vi.mock('../../../../src/lib/jobDescription/jobDescriptionRepository', () => ({
  saveJobDescription: vi.fn(),
  getJobDescriptionsByUser: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { parseJobDescription } from '../../../../src/lib/jobDescription/parseJobDescription';
import {
  saveJobDescription,
  getJobDescriptionsByUser,
} from '../../../../src/lib/jobDescription/jobDescriptionRepository';
import { POST, GET } from '../route';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockParse = parseJobDescription as unknown as ReturnType<typeof vi.fn>;
const mockSave = saveJobDescription as unknown as ReturnType<typeof vi.fn>;
const mockGetAll = getJobDescriptionsByUser as unknown as ReturnType<typeof vi.fn>;

const mockUser = { userId: 'user_clerk_abc', user: { id: 'user-db-cuid' } };

const mockParsed = {
  type: 'text' as const,
  rawText: 'Senior Engineer role at Acme Corp.',
};

const mockSaved = {
  id: 'jd-cuid-123',
  userId: 'user-db-cuid',
  content: 'Senior Engineer role at Acme Corp.',
  sourceUrl: null,
  title: null,
  company: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/job-descriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/job-descriptions', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await POST(makeRequest({ input: 'some job' }));
    expect(res.status).toBe(401);
  });

  it('parses and saves a text job description', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockParse.mockResolvedValue(mockParsed);
    mockSave.mockResolvedValue(mockSaved);

    const res = await POST(makeRequest({ input: 'Senior Engineer role at Acme Corp.' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(mockParse).toHaveBeenCalledWith('Senior Engineer role at Acme Corp.');
    expect(mockSave).toHaveBeenCalledWith('user_clerk_abc', mockParsed);
    expect(body.id).toBe('jd-cuid-123');
  });

  it('returns 400 when input is missing', async () => {
    mockAuth.mockResolvedValue(mockUser);

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when input is empty string', async () => {
    mockAuth.mockResolvedValue(mockUser);

    const res = await POST(makeRequest({ input: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when input is whitespace only', async () => {
    mockAuth.mockResolvedValue(mockUser);

    const res = await POST(makeRequest({ input: '   ' }));
    expect(res.status).toBe(400);
  });

  it('returns 422 when parseJobDescription throws a validation error', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockParse.mockRejectedValue(new Error('Job description is too long'));

    const res = await POST(makeRequest({ input: 'a'.repeat(60000) }));
    expect(res.status).toBe(422);
  });

  it('returns 422 when URL fetch fails', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockParse.mockRejectedValue(new Error('Failed to fetch job description: HTTP 404'));

    const res = await POST(makeRequest({ input: 'https://example.com/jobs/404' }));
    expect(res.status).toBe(422);
  });
});

describe('GET /api/job-descriptions', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const res = await GET(new Request('http://localhost/api/job-descriptions'));
    expect(res.status).toBe(401);
  });

  it('returns list of job descriptions for the authenticated user', async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockGetAll.mockResolvedValue([mockSaved]);

    const res = await GET(new Request('http://localhost/api/job-descriptions'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockGetAll).toHaveBeenCalledWith('user_clerk_abc');
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe('jd-cuid-123');
  });
});
