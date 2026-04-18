import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

import { auth, currentUser } from '@clerk/nextjs/server';
import { isDevBypass, getAuth, getCurrentUser } from './auth';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockCurrentUser = currentUser as unknown as ReturnType<typeof vi.fn>;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// isDevBypass
// ---------------------------------------------------------------------------

describe('isDevBypass', () => {
  it('returns false when NODE_ENV is production even with DEV_AUTH_BYPASS=1', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DEV_AUTH_BYPASS', '1');
    expect(isDevBypass()).toBe(false);
  });

  it('returns false when DEV_AUTH_BYPASS is not set', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DEV_AUTH_BYPASS', '');
    expect(isDevBypass()).toBe(false);
  });

  it('returns false when DEV_AUTH_BYPASS is "0"', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DEV_AUTH_BYPASS', '0');
    expect(isDevBypass()).toBe(false);
  });

  it('returns true when NODE_ENV is not production and DEV_AUTH_BYPASS is "1"', () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DEV_AUTH_BYPASS', '1');
    expect(isDevBypass()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getAuth
// ---------------------------------------------------------------------------

describe('getAuth', () => {
  describe('bypass path', () => {
    it('returns default dev userId when DEV_USER_ID is not set', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('DEV_AUTH_BYPASS', '1');
      delete process.env.DEV_USER_ID;
      const result = await getAuth();
      expect(result).toEqual({ userId: 'dev_user_local' });
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('returns custom DEV_USER_ID when set', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('DEV_AUTH_BYPASS', '1');
      vi.stubEnv('DEV_USER_ID', 'custom_dev_id');
      const result = await getAuth();
      expect(result).toEqual({ userId: 'custom_dev_id' });
      expect(mockAuth).not.toHaveBeenCalled();
    });
  });

  describe('real path', () => {
    it('delegates to Clerk auth() and returns userId', async () => {
      vi.stubEnv('DEV_AUTH_BYPASS', '0');
      mockAuth.mockResolvedValue({ userId: 'clerk_user_123' });
      const result = await getAuth();
      expect(result).toEqual({ userId: 'clerk_user_123' });
      expect(mockAuth).toHaveBeenCalledOnce();
    });

    it('returns { userId: null } when Clerk returns null', async () => {
      vi.stubEnv('DEV_AUTH_BYPASS', '0');
      mockAuth.mockResolvedValue({ userId: null });
      const result = await getAuth();
      expect(result).toEqual({ userId: null });
    });
  });
});

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------

describe('getCurrentUser', () => {
  describe('bypass path', () => {
    it('returns fake dev email and does not call Clerk', async () => {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('DEV_AUTH_BYPASS', '1');
      const result = await getCurrentUser();
      expect(result).toEqual({ emailAddresses: [{ emailAddress: 'dev@local' }] });
      expect(mockCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('real path', () => {
    it('returns null when Clerk currentUser() returns null', async () => {
      vi.stubEnv('DEV_AUTH_BYPASS', '0');
      mockCurrentUser.mockResolvedValue(null);
      const result = await getCurrentUser();
      expect(result).toBeNull();
    });

    it('maps Clerk emailAddresses array', async () => {
      vi.stubEnv('DEV_AUTH_BYPASS', '0');
      mockCurrentUser.mockResolvedValue({
        emailAddresses: [
          { emailAddress: 'a@example.com', id: 'ea1' },
          { emailAddress: 'b@example.com', id: 'ea2' },
        ],
      });
      const result = await getCurrentUser();
      expect(result).toEqual({
        emailAddresses: [{ emailAddress: 'a@example.com' }, { emailAddress: 'b@example.com' }],
      });
    });

    it('does not call Clerk auth()', async () => {
      vi.stubEnv('DEV_AUTH_BYPASS', '0');
      mockCurrentUser.mockResolvedValue(null);
      await getCurrentUser();
      expect(mockAuth).not.toHaveBeenCalled();
    });
  });
});
