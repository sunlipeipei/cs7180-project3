import { test, expect, type Route, type Page } from '@playwright/test';
import path from 'node:path';
import { resumesFixture } from '../src/fixtures/index';

// ── Fixture identifiers ──────────────────────────────────────────────────────
//
// The golden-path flow is entirely client-side; every API call is stubbed
// at the Playwright router. We keep the fixtures identical to the committed
// Phase-0.5 fixtures so the preview assertions stay stable even if the
// underlying schema widens.
//
// JD_ID and RESUME_ID are stable so the stubs for /tailor/[resumeId] and
// /refine can key off the exact path.

const JD_ID = 'e2e-golden-jd-1';
const RESUME_ID = 'e2e-golden-resume-1';
const RESUME_PDF = path.join(__dirname, 'fixtures', 'software.pdf');

const LLM_PROFILE = {
  schemaVersion: 1,
  name: 'Jordan Lee',
  email: 'jordan.lee@example.com',
  phone: '+1-415-555-0192',
  summary: null,
  skills: [{ name: 'TypeScript', category: null, level: 'Expert' }],
  workExperience: [
    {
      company: 'Stripe',
      title: 'Senior Software Engineer',
      startDate: '2022-03-01',
      endDate: null,
      location: null,
      descriptions: ['Redesigned Payment Intent API'],
    },
  ],
  education: [
    {
      school: 'University of Waterloo',
      degree: 'B.S. Computer Science',
      fieldOfStudy: null,
      startDate: null,
      endDate: null,
      gpa: null,
    },
  ],
};

const TAILORED_RESUME = {
  ...resumesFixture[1],
  resumeId: RESUME_ID,
  jobDescriptionId: JD_ID,
};

const JD_ROW = {
  id: JD_ID,
  content: 'Senior Software Engineer at ACME — build reliable systems.',
  title: 'Senior Software Engineer',
  company: 'ACME',
  createdAt: new Date().toISOString(),
};

// Minimal bytes that a real PDF file starts with. The Render-PDF stub below
// responds with these bytes plus an `attachment` Content-Disposition header
// so Chrome fires Playwright's `download` event.
const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF', 'utf-8');

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Install every stub the golden path exercises. Mutable `state` lets GET
 * handlers reflect earlier POST/PUT effects so the dashboard picks up the
 * JD after intake, and /tailor/[id] can resolve after tailor returns.
 */
async function stubGoldenPath(page: Page) {
  const state = {
    profile: null as unknown,
    jds: [] as unknown[],
    resumes: [] as unknown[],
  };

  // /api/profile — GET (404 first, 200 after save/ingest), PUT, POST ingest.
  await page.route('**/api/profile**', async (route: Route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    if (url.pathname === '/api/profile/ingest' && method === 'POST') {
      state.profile = LLM_PROFILE;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profile: LLM_PROFILE }),
      });
    }

    if (url.pathname === '/api/profile' && method === 'GET') {
      if (state.profile === null) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not found' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profile: state.profile }),
      });
    }

    if (url.pathname === '/api/profile' && method === 'PUT') {
      state.profile = JSON.parse(route.request().postData() ?? '{}');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profile: state.profile }),
      });
    }

    return route.continue();
  });

  // /api/job-descriptions — POST adds a row; list/get return current state.
  await page.route('**/api/job-descriptions**', async (route: Route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();

    if (url.pathname === '/api/job-descriptions' && method === 'POST') {
      state.jds = [JD_ROW];
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(JD_ROW),
      });
    }

    if (url.pathname === '/api/job-descriptions' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.jds),
      });
    }

    if (url.pathname === `/api/job-descriptions/${JD_ID}` && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(JD_ROW),
      });
    }

    return route.continue();
  });

  // /api/tailor — POST returns the seeded resume and "persists" it.
  await page.route('**/api/tailor', async (route: Route) => {
    if (route.request().method() === 'POST') {
      state.resumes = [TAILORED_RESUME];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resumeId: RESUME_ID, resume: TAILORED_RESUME }),
      });
    }
    return route.continue();
  });

  // /api/resumes — LIST for dashboard + GET by id for /tailor/[id].
  await page.route('**/api/resumes', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resumes: state.resumes }),
      });
    }
    return route.continue();
  });

  await page.route(`**/api/resumes/${RESUME_ID}`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resume: TAILORED_RESUME }),
      });
    }
    return route.continue();
  });

  // /api/resumes/[id]/refine — returns stubbed updated markdown for summary.
  await page.route(`**/api/resumes/${RESUME_ID}/refine`, async (route: Route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          resumeId: RESUME_ID,
          section: 'summary',
          updatedMarkdown: '## Summary\nGolden-path refined summary.',
          updatedAt: new Date().toISOString(),
        }),
      });
    }
    return route.continue();
  });

  // /api/resumes/[resumeId]/pdf — stubbed at the BrowserContext so the popup
  // page opened by window.open(url, '_blank') also sees the stub. page.route
  // only covers the originating page, not child popups.
  await page.context().route(`**/api/resumes/${RESUME_ID}/pdf`, async (route: Route) => {
    return route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
      body: PDF_BYTES,
    });
  });
}

// ── Test ────────────────────────────────────────────────────────────────────

test.describe('Phase 1.E — Playwright golden path', () => {
  test('sign-in bypass → profile ingest → JD intake → tailor → refine → PDF download', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await stubGoldenPath(page);

    // ── Step 1: upload a resume PDF on /profile ──────────────────────────────

    const ingestRequest = page.waitForRequest(
      (req) => req.url().endsWith('/api/profile/ingest') && req.method() === 'POST'
    );

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /your master profile/i })).toBeVisible({
      timeout: 15000,
    });

    await page.getByLabel('Import resume PDF').setInputFiles(RESUME_PDF);
    await ingestRequest;

    await expect(page.getByLabel('Full Name')).toHaveValue(LLM_PROFILE.name);
    await expect(page.getByLabel('Email')).toHaveValue(LLM_PROFILE.email);
    // The ingest handler already flipped server state to "has profile", so
    // /dashboard will read it on the next GET. No save click required.

    // ── Step 2: paste a JD on /dashboard/new ─────────────────────────────────

    const jdPostPromise = page.waitForRequest(
      (req) => req.url().endsWith('/api/job-descriptions') && req.method() === 'POST'
    );

    await page.goto('/dashboard/new');
    const textarea = page.getByPlaceholder('Paste the full job description here…');
    await textarea.fill('Senior Software Engineer at ACME — build reliable distributed systems.');
    await page.getByRole('button', { name: /Start Tailoring/i }).click();

    await jdPostPromise;
    await page.waitForURL('**/dashboard');

    // ── Step 3: click Tailor on the dashboard card ───────────────────────────

    const tailorButton = page.getByRole('button', {
      name: new RegExp(`Tailor resume for ${JD_ROW.title}`, 'i'),
    });
    await expect(tailorButton).toBeVisible();

    const tailorPostPromise = page.waitForRequest(
      (req) => req.url().endsWith('/api/tailor') && req.method() === 'POST'
    );

    await tailorButton.click();
    await tailorPostPromise;

    // Router redirects to /tailor/[resumeId]; preview should render.
    await page.waitForURL(`**/tailor/${RESUME_ID}`);
    const preview = page.locator('pre[role="document"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('Senior Software Engineer — Stripe');
    await expect(preview).toContainText('BypassHire');

    // ── Step 4: refine the Summary section ───────────────────────────────────

    await page.getByRole('button', { name: 'Refine' }).click();
    await expect(page.getByRole('heading', { name: 'Refine Section' })).toBeVisible();

    await page.locator('#refine-section').selectOption('summary');
    await page.locator('#refine-instruction').fill('make it shorter');

    const refinePostPromise = page.waitForRequest(
      (req) => req.url().endsWith(`/api/resumes/${RESUME_ID}/refine`) && req.method() === 'POST'
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    await refinePostPromise;

    await expect(preview).toContainText('Golden-path refined summary.');
    await expect(page.getByText('Section refined')).toBeVisible();

    // ── Step 5: click Render PDF — expect the PDF endpoint to be hit ─────────
    //
    // The app calls window.open(url, '_blank'). Chromium opens a popup that
    // requests the stubbed PDF endpoint. Rather than depend on Chromium's
    // popup-download event semantics (which vary across versions), we assert
    // that the PDF request was made with a 200 and attachment disposition.

    const pdfRequestPromise = page
      .context()
      .waitForEvent(
        'response',
        (res) => res.url().includes(`/api/resumes/${RESUME_ID}/pdf`) && res.status() === 200
      );
    await page.getByRole('button', { name: /render pdf/i }).click();
    const pdfResponse = await pdfRequestPromise;

    expect(pdfResponse.headers()['content-type']).toMatch(/application\/pdf/);
    expect(pdfResponse.headers()['content-disposition']).toMatch(/attachment/);

    // Body bytes can't be read after the popup closes (Protocol: No resource
    // with given identifier). The fulfilled headers + 200 status prove the
    // stub was hit and Chromium treated the response as an attachment.

    await expect(page.getByText(/pdf download started/i)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
