import { test, expect, type Route } from '@playwright/test';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Stub every read endpoint the dashboard or profile page touches to return
 * the "nothing yet" shape:
 *   - GET /api/profile        → 404
 *   - GET /api/job-descriptions → []
 *   - GET /api/resumes        → { resumes: [] }
 *
 * We do NOT stub POST/PUT here; the empty-state tests never submit anything.
 */
async function stubEmptyBackend(page: import('@playwright/test').Page) {
  await page.route('**/api/profile**', async (route: Route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/profile' && route.request().method() === 'GET') {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      });
    }
    return route.continue();
  });

  await page.route('**/api/job-descriptions**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.continue();
  });

  await page.route('**/api/resumes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resumes: [] }),
      });
    }
    return route.continue();
  });
}

// ── /profile empty state ────────────────────────────────────────────────────

test.describe('Empty state — /profile with no saved profile', () => {
  test('renders editor header and an Import-from-PDF affordance', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await stubEmptyBackend(page);
    await page.goto('/profile');

    // Header proves the page rendered past its "loading…" state.
    await expect(page.getByRole('heading', { name: /your master profile/i })).toBeVisible({
      timeout: 15000,
    });

    // Import button is the primary CTA for a brand-new user.
    await expect(page.getByRole('button', { name: /import from pdf/i })).toBeVisible();

    // The editor form is present with blank primary fields.
    await expect(page.getByLabel('Full Name')).toHaveValue('');
    await expect(page.getByLabel('Email')).toHaveValue('');

    expect(pageErrors).toEqual([]);
  });
});

// ── /dashboard empty state ──────────────────────────────────────────────────

test.describe('Empty state — /dashboard with no profile, no JDs, no resumes', () => {
  test('each section renders its empty-state copy and a clear next action', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await stubEmptyBackend(page);
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: 15000,
    });

    // Profile card — empty state.
    await expect(page.getByRole('heading', { name: /no profile yet/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create profile/i })).toBeVisible();

    // JDs list — empty state + link to new-JD flow.
    await expect(page.getByText(/no job descriptions yet/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /\+ new/i })).toBeVisible();

    // Resumes list — empty state.
    await expect(page.getByText(/no resumes yet/i)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
