import { describe, it, expect } from 'vitest';
import { isPublicRoute, isProtectedRoute } from '../routeConfig';

describe('route protection config', () => {
  describe('isPublicRoute', () => {
    it('allows homepage', () => {
      expect(isPublicRoute('/')).toBe(true);
    });

    it('allows sign-in page', () => {
      expect(isPublicRoute('/sign-in')).toBe(true);
    });

    it('allows sign-up page', () => {
      expect(isPublicRoute('/sign-up')).toBe(true);
    });

    it('allows Clerk webhook endpoint', () => {
      expect(isPublicRoute('/api/webhooks/clerk')).toBe(true);
    });

    it('does not allow dashboard', () => {
      expect(isPublicRoute('/dashboard')).toBe(false);
    });

    it('does not allow nested dashboard routes', () => {
      expect(isPublicRoute('/dashboard/jobs')).toBe(false);
    });

    it('does not allow resume routes', () => {
      expect(isPublicRoute('/resume/abc123')).toBe(false);
    });

    it('does not allow API routes (except webhooks)', () => {
      expect(isPublicRoute('/api/jobs')).toBe(false);
    });
  });

  describe('isProtectedRoute', () => {
    it('protects /dashboard', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true);
    });

    it('protects nested dashboard routes', () => {
      expect(isProtectedRoute('/dashboard/jobs/new')).toBe(true);
    });

    it('protects /resume routes', () => {
      expect(isProtectedRoute('/resume/abc123')).toBe(true);
    });

    it('protects API routes', () => {
      expect(isProtectedRoute('/api/jobs')).toBe(true);
    });

    it('does not protect homepage', () => {
      expect(isProtectedRoute('/')).toBe(false);
    });

    it('does not protect sign-in', () => {
      expect(isProtectedRoute('/sign-in')).toBe(false);
    });
  });
});
