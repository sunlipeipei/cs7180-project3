import { test, expect, type Route } from '@playwright/test';
import path from 'node:path';
import { resumesFixture } from '../src/fixtures/index';

// ── Fixture identifiers ──────────────────────────────────────────────────────

const JD_ID = 'e2e-loading-jd-1';
const RESUME_ID = 'e2e-loading-resume-1';
const RESUME_PDF = path.join(__dirname, 'fixtures', 'software.pdf');

// How long the stubbed API waits before responding. Long enough that the
// spinner/status is unambiguously observable via Playwright auto-waiting,
// short enough to keep the test sub-second.
const SLOW_MS = 600;

/** Resolve after `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── /profile ingest spinner ─────────────────────────────────────────────────

test.describe('Loading state — profile ingest spinner', () => {
  test('POST /api/profile/ingest in-flight flips the import button to "Parsing PDF…"', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    // Slow the ingest POST so the button state is easy to assert.
    await page.route('**/api/profile**', async (route: Route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (url.pathname === '/api/profile/ingest' && method === 'POST') {
        await delay(SLOW_MS);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            profile: {
              schemaVersion: 1,
              name: 'Ada Lovelace',
              email: 'ada@example.com',
              phone: '+1-555-0100',
              skills: [],
              workExperience: [],
              education: [],
            },
          }),
        });
      }

      if (url.pathname === '/api/profile' && method === 'GET') {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' }),
        });
      }

      return route.continue();
    });

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /your master profile/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByLabel('Import resume PDF').setInputFiles(RESUME_PDF);

    // While the ingest POST is in flight, the button switches to "Parsing PDF…"
    // and becomes disabled. Auto-waiting catches this without racing.
    const parsingButton = page.getByRole('button', { name: /parsing pdf/i });
    await expect(parsingButton).toBeVisible();
    await expect(parsingButton).toBeDisabled();

    // When the ingest resolves, the button returns to "Import from PDF".
    await expect(page.getByRole('button', { name: /import from pdf/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

// ── /dashboard tailor spinner ───────────────────────────────────────────────

test.describe('Loading state — dashboard tailor spinner', () => {
  test('POST /api/tailor in-flight flips the JD card CTA to "Tailoring…"', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    const jdRow = {
      id: JD_ID,
      content: 'Senior Software Engineer at ACME',
      title: 'Senior Software Engineer',
      company: 'ACME',
      createdAt: new Date().toISOString(),
    };

    const tailoredResume = {
      ...resumesFixture[1],
      resumeId: RESUME_ID,
      jobDescriptionId: JD_ID,
    };

    await page.route('**/api/profile**', async (route: Route) => {
      // Dashboard needs SOME profile response; 404 is the simplest.
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      });
    });

    await page.route('**/api/job-descriptions**', async (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([jdRow]),
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

    // Slow the tailor POST so the "Tailoring…" state is observable.
    await page.route('**/api/tailor', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await delay(SLOW_MS);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ resumeId: RESUME_ID, resume: tailoredResume }),
        });
      }
      return route.continue();
    });

    // The tailor-page load after redirect needs its reads stubbed.
    await page.route(`**/api/resumes/${RESUME_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ resume: tailoredResume }),
        });
      }
      return route.continue();
    });

    await page.route(`**/api/job-descriptions/${JD_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(jdRow),
        });
      }
      return route.continue();
    });

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
      timeout: 15000,
    });

    const tailorButton = page.getByRole('button', {
      name: new RegExp(`Tailor resume for ${jdRow.title}`, 'i'),
    });
    await expect(tailorButton).toBeVisible();
    await tailorButton.click();

    // While POST /api/tailor is in flight, the button text flips to
    // "Tailoring…" and the button is disabled.
    await expect(tailorButton).toHaveText(/tailoring…/i);
    await expect(tailorButton).toBeDisabled();

    // Eventually the router pushes us onto /tailor/[resumeId].
    await page.waitForURL(`**/tailor/${RESUME_ID}`);

    expect(pageErrors).toEqual([]);
  });
});

// ── /tailor refine spinner ──────────────────────────────────────────────────

test.describe('Loading state — tailor refine spinner', () => {
  test('POST /api/resumes/[id]/refine in-flight flips Submit to "Refining…"', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    const tailoredResume = {
      ...resumesFixture[1],
      resumeId: RESUME_ID,
      jobDescriptionId: JD_ID,
    };

    await page.route(`**/api/resumes/${RESUME_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ resume: tailoredResume }),
        });
      }
      return route.continue();
    });

    await page.route(`**/api/job-descriptions/${JD_ID}`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: JD_ID,
            title: 'Senior Engineer',
            company: 'ACME',
            content: 'Build great things.',
            createdAt: new Date().toISOString(),
          }),
        });
      }
      return route.continue();
    });

    await page.route(`**/api/resumes/${RESUME_ID}/refine`, async (route: Route) => {
      if (route.request().method() === 'POST') {
        await delay(SLOW_MS);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            resumeId: RESUME_ID,
            section: 'summary',
            updatedMarkdown: '## Summary\nShorter.',
            updatedAt: new Date().toISOString(),
          }),
        });
      }
      return route.continue();
    });

    await page.goto(`/tailor/${RESUME_ID}`);
    await expect(page.locator('pre[role="document"]')).toBeVisible();

    await page.getByRole('button', { name: 'Refine' }).click();
    await expect(page.getByRole('heading', { name: 'Refine Section' })).toBeVisible();

    await page.locator('#refine-section').selectOption('summary');
    await page.locator('#refine-instruction').fill('make it shorter');

    const submitBtn = page.getByRole('button', { name: 'Submit' });
    await submitBtn.click();

    // While POST /refine is in flight, Submit flips to "Refining…" and
    // becomes disabled.
    const refiningBtn = page.getByRole('button', { name: /refining/i });
    await expect(refiningBtn).toBeVisible();
    await expect(refiningBtn).toBeDisabled();

    // Once the POST resolves, the dialog closes and a transient status appears.
    await expect(page.getByText('Section refined')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
