import { test, expect, type Route } from '@playwright/test';
import path from 'node:path';

const RESUME_PDF = path.join(__dirname, 'fixtures', 'software.pdf');

// Payload that mirrors the shape OpenRouter returns today: `null` stands in
// for "unknown" rather than an omitted key. The schema widened in the
// companion GREEN commit is what allows this to round-trip cleanly through
// both the server (/api/profile/ingest) and the client-side service layer
// (profile.service.ts → MasterProfileSchema.parse).
const LLM_SHAPED_PROFILE = {
  schemaVersion: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+44-20-7946-0000',
  summary: null,
  address: {
    street: null,
    city: 'London',
    state: null,
    zip: null,
    country: 'UK',
  },
  links: {
    github: 'https://github.com/ada',
    linkedin: null,
    portfolio: null,
    other: null,
  },
  skills: [
    { name: 'TypeScript', category: null, level: null },
    { name: 'Analytical Engines', category: 'Legacy', level: 'Expert' },
  ],
  workExperience: [
    {
      company: 'Analytical Engine Labs',
      title: 'Lead Programmer',
      startDate: '1843-01-01',
      endDate: null,
      location: null,
      descriptions: ['Authored the first algorithm for a computing machine.'],
    },
  ],
  education: [
    {
      school: 'Private Tutoring',
      degree: 'Mathematics',
      fieldOfStudy: null,
      startDate: null,
      endDate: null,
      gpa: null,
    },
  ],
  projects: null,
  certifications: null,
  resumeTemplatePath: null,
  contextSources: null,
  preferences: null,
};

test.describe('profile ingest — null-optional LLM response renders without crashing', () => {
  test.beforeEach(async ({ page }) => {
    // Stub every /api/profile* request the page will make. The real routes
    // are auth-gated and (for ingest) hit OpenRouter + the DB; for this E2E
    // we only care that the UI handles the response shape.
    //
    // Keep the handlers order-aware because we use GET → 404 → PUT → 200
    // for the same URL.
    let profileOnServer: unknown | null = null;

    // Broad single handler keyed off the pathname — simplest way to avoid
    // Playwright glob / handler-order subtleties (e.g. `**/api/profile` can
    // swallow `**/api/profile/ingest` in some Playwright versions).
    await page.route('**/api/profile**', async (route: Route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (url.pathname === '/api/profile/ingest' && method === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ profile: LLM_SHAPED_PROFILE }),
        });
      }

      if (url.pathname === '/api/profile' && method === 'GET') {
        if (profileOnServer === null) {
          return route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Not found' }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ profile: profileOnServer }),
        });
      }

      if (url.pathname === '/api/profile' && method === 'PUT') {
        profileOnServer = JSON.parse(route.request().postData() ?? '{}');
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ profile: profileOnServer }),
        });
      }

      return route.continue();
    });
  });

  test('upload stubbed PDF → profile page renders LLM-shaped response without error', async ({
    page,
  }) => {
    // Surface any client-side crash immediately as a test failure.
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('request', (req) => {
      if (req.url().includes('/api/profile')) {
        // eslint-disable-next-line no-console
        console.log('[E2E request]', req.method(), req.url());
      }
    });
    page.on('response', (res) => {
      if (res.url().includes('/api/profile')) {
        // eslint-disable-next-line no-console
        console.log('[E2E response]', res.status(), res.url());
      }
    });

    const ingestRequest = page.waitForRequest(
      (req) => req.url().endsWith('/api/profile/ingest') && req.method() === 'POST'
    );

    await page.goto('/profile');
    // Give the client-side effect chain (getProfile → setState) time to settle.
    await expect(page.getByRole('heading', { name: /your master profile/i })).toBeVisible({
      timeout: 15000,
    });

    // The "Import from PDF" button triggers a hidden file input; attaching the
    // PDF directly to the input is the canonical Playwright pattern.
    const fileInput = page.getByLabel('Import resume PDF');
    await fileInput.setInputFiles(RESUME_PDF);

    await ingestRequest;

    // Import status clears and the parsed profile populates the form.
    await expect(page.getByLabel('Full Name')).toHaveValue(LLM_SHAPED_PROFILE.name);
    await expect(page.getByLabel('Email')).toHaveValue(LLM_SHAPED_PROFILE.email);

    // Skills tab: null category/level still render the skill chip.
    await page.getByRole('tab', { name: /^skills$/i }).click();
    await expect(page.getByRole('button', { name: /remove typescript/i })).toBeVisible();

    // Raw JSON tab shows the nulls preserved — proves no client-side
    // sanitisation accidentally ate them.
    await page.getByRole('tab', { name: /raw json/i }).click();
    const rawJson = page.getByTestId('raw-json-pre');
    await expect(rawJson).toContainText('"category": null');
    await expect(rawJson).toContainText('"summary": null');

    expect(pageErrors).toEqual([]);
  });
});
