import { test, expect, type Route, type Page } from '@playwright/test';

// Minimal raw JD row that matches the RawJdRow shape in jobDescription.service.ts.
function makeJdRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'jd-e2e-1',
    content: 'Senior Engineer at Acme.',
    title: null,
    company: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Register all stubs needed by the /dashboard/new page and the /dashboard
// landing it redirects to. Keyed off pathname so handler ordering is explicit.
async function stubAllRoutes(page: Page, jdRowOverride: Record<string, unknown> = {}) {
  await page.route('**/api/job-descriptions**', async (route: Route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    if (url.pathname === '/api/job-descriptions' && method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(makeJdRow(jdRowOverride)),
      });
    }

    if (url.pathname === '/api/job-descriptions' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }

    return route.continue();
  });

  await page.route('**/api/profile**', async (route: Route) => {
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Not found' }),
    });
  });

  await page.route('**/api/resumes**', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

test.describe('JD intake — /dashboard/new', () => {
  test('regression PR#60: paste-mode JD containing a URL substring submits with source=paste', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await stubAllRoutes(page);

    const JD_TEXT =
      'Senior Engineer at Acme. Apply at https://apply.example.com/careers. Remote-friendly team.';

    // Capture the POST before it fires so we can inspect the body.
    const postPromise = page.waitForRequest(
      (req) => req.url().includes('/api/job-descriptions') && req.method() === 'POST'
    );

    await page.goto('/dashboard/new');

    // "Paste Text" is the default mode — verify it without clicking.
    await expect(page.getByRole('button', { name: 'Paste Text' })).toBeVisible();

    const textarea = page.getByPlaceholder('Paste the full job description here…');
    await expect(textarea).toBeVisible();
    await textarea.fill(JD_TEXT);

    await page.getByRole('button', { name: /Start Tailoring/i }).click();

    const postReq = await postPromise;
    const body = JSON.parse(postReq.postData() ?? '{}') as {
      input: string;
      source: string;
    };

    expect(body.source).toBe('paste');
    expect(body.input).toContain('https://apply.example.com/careers');

    await page.waitForURL('**/dashboard');

    expect(pageErrors).toEqual([]);
  });

  test('URL mode submits with source=url', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await stubAllRoutes(page, { sourceUrl: 'https://example.com/jobs/1' });

    const postPromise = page.waitForRequest(
      (req) => req.url().includes('/api/job-descriptions') && req.method() === 'POST'
    );

    await page.goto('/dashboard/new');

    // Switch to URL mode.
    await page.getByRole('button', { name: 'Enter URL' }).click();

    const urlInput = page.getByPlaceholder(/https:\/\/jobs\.example\.com/);
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://example.com/jobs/1');

    await page.getByRole('button', { name: /Start Tailoring/i }).click();

    const postReq = await postPromise;
    const body = JSON.parse(postReq.postData() ?? '{}') as {
      input: string;
      source: string;
    };

    expect(body.source).toBe('url');
    expect(body.input).toBe('https://example.com/jobs/1');

    await page.waitForURL('**/dashboard');

    expect(pageErrors).toEqual([]);
  });

  test('submit button is disabled with empty or whitespace-only input', async ({ page }) => {
    await stubAllRoutes(page);

    await page.goto('/dashboard/new');

    const submitBtn = page.getByRole('button', { name: /Start Tailoring/i });

    // Initially disabled (no input).
    await expect(submitBtn).toBeDisabled();

    // Whitespace only — still disabled.
    const textarea = page.getByPlaceholder('Paste the full job description here…');
    await textarea.fill('   ');
    await expect(submitBtn).toBeDisabled();

    // Real content — becomes enabled.
    await textarea.fill('Software Engineer at Initech');
    await expect(submitBtn).toBeEnabled();
  });
});
