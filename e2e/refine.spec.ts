import { test, expect, type Route } from '@playwright/test';
import { resumesFixture } from '../src/fixtures/index';

// ── Fixture setup ─────────────────────────────────────────────────────────────

const RESUME_ID = 'e2e-resume-refine-1';
const JD_ID = 'e2e-jd-1';

// Pull the rich resume (index 1) and override IDs to stable strings.
const seededResume = {
  ...resumesFixture[1],
  resumeId: RESUME_ID,
  jobDescriptionId: JD_ID,
};

// Short anchors from each section so we can assert byte-identity after refine.
const HEADER_ANCHOR = 'jordan.lee@example.com';
const SUMMARY_ANCHOR = 'Senior software engineer with 6+';
const SKILLS_ANCHOR = 'TypeScript (Expert)';
const EXPERIENCE_ANCHOR = 'Senior Software Engineer — Stripe';
const EDUCATION_ANCHOR = 'University of Waterloo';
const PROJECTS_ANCHOR = 'BypassHire';

// Updated summary returned by the stubbed POST /refine.
const REFINED_SUMMARY_MD = '## Summary\nShorter.';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Stub the three API calls the tailor page makes on load + the refine POST. */
async function stubTailorPage(page: import('@playwright/test').Page) {
  // GET /api/resumes/<id>  → { resume: seededResume }
  await page.route(`**/api/resumes/${RESUME_ID}`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ resume: seededResume }),
      });
    }
    return route.continue();
  });

  // GET /api/job-descriptions/<jdId>  → raw JD row shape
  await page.route(`**/api/job-descriptions/${JD_ID}`, async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: JD_ID,
          title: 'Senior Engineer',
          company: 'Acme',
          content: 'Build great things.',
          createdAt: new Date().toISOString(),
        }),
      });
    }
    return route.continue();
  });

  // POST /api/resumes/<id>/refine  → RefineResponse (raw, not enveloped)
  await page.route(`**/api/resumes/${RESUME_ID}/refine`, async (route: Route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          resumeId: RESUME_ID,
          section: 'summary',
          updatedMarkdown: REFINED_SUMMARY_MD,
          updatedAt: new Date().toISOString(),
        }),
      });
    }
    return route.continue();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('PR #61 smoke — POST /api/resumes/[id]/refine', () => {
  test('refine summary: only summary changes, other sections unchanged', async ({ page }) => {
    // 1. Collect page-level JS errors.
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    // 2. Stub all API calls.
    await stubTailorPage(page);

    // 3. Navigate to the tailor page.
    await page.goto(`/tailor/${RESUME_ID}`);

    // 4. Wait for the preview pane to render with seeded content.
    const preview = page.locator('pre[role="document"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(SUMMARY_ANCHOR);
    await expect(preview).toContainText(EXPERIENCE_ANCHOR);

    // 5. Click the "Refine" button → dialog should open.
    await page.getByRole('button', { name: 'Refine' }).click();

    // Wait for the dialog title to be visible.
    await expect(page.getByRole('heading', { name: 'Refine Section' })).toBeVisible();

    // 6. Confirm the section select defaults to "summary".
    const sectionSelect = page.locator('#refine-section');
    await expect(sectionSelect).toHaveValue('summary');

    // 7. Fill the instruction textarea.
    const instructionTextarea = page.locator('#refine-instruction');
    await instructionTextarea.fill('make it shorter');

    // 8. Set up waitForRequest BEFORE clicking Submit.
    const refinePostPromise = page.waitForRequest((req) => {
      if (!req.url().includes(`/api/resumes/${RESUME_ID}/refine`)) return false;
      if (req.method() !== 'POST') return false;
      try {
        const body = JSON.parse(req.postData() ?? '{}') as {
          section?: string;
          instruction?: string;
        };
        return body.section === 'summary' && body.instruction === 'make it shorter';
      } catch {
        return false;
      }
    });

    // 9. Click Submit.
    await page.getByRole('button', { name: 'Submit' }).click();

    // 10. Await the intercepted request.
    await refinePostPromise;

    // 11a. Preview now contains the refined summary markdown.
    await expect(preview).toContainText('## Summary');
    await expect(preview).toContainText('Shorter.');

    // 11b. Original summary text is gone (replaced).
    await expect(preview).not.toContainText(SUMMARY_ANCHOR);

    // 11c. All other sections are byte-identical — anchor check.
    await expect(preview).toContainText(HEADER_ANCHOR);
    await expect(preview).toContainText(SKILLS_ANCHOR);
    await expect(preview).toContainText(EXPERIENCE_ANCHOR);
    await expect(preview).toContainText(EDUCATION_ANCHOR);
    await expect(preview).toContainText(PROJECTS_ANCHOR);

    // 11d. Transient "Section refined" status message appears.
    await expect(page.getByText('Section refined')).toBeVisible();

    // 12. No JS errors.
    expect(pageErrors).toEqual([]);
  });

  test('refine for each section updates only that section', async ({ page }) => {
    const SECTIONS = [
      'header',
      'summary',
      'skills',
      'experience',
      'education',
      'projects',
    ] as const;

    // Anchors keyed by section — these appear in the ORIGINAL fixture data.
    const anchors: Record<string, string> = {
      header: HEADER_ANCHOR,
      summary: SUMMARY_ANCHOR,
      skills: SKILLS_ANCHOR,
      experience: EXPERIENCE_ANCHOR,
      education: EDUCATION_ANCHOR,
      projects: PROJECTS_ANCHOR,
    };

    const pageErrors: string[] = [];
    const onPageError = (err: Error) => pageErrors.push(String(err));
    page.on('pageerror', onPageError);

    for (const section of SECTIONS) {
      // Stub GET /resumes/<id>.
      await page.route(`**/api/resumes/${RESUME_ID}`, async (route: Route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ resume: seededResume }),
          });
        }
        return route.continue();
      });

      // Stub GET /job-descriptions/<jdId>.
      await page.route(`**/api/job-descriptions/${JD_ID}`, async (route: Route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: JD_ID,
              title: 'Senior Engineer',
              company: 'Acme',
              content: 'Build great things.',
              createdAt: new Date().toISOString(),
            }),
          });
        }
        return route.continue();
      });

      // Stub POST /refine — returns updated markdown only for the target section.
      const stubbedMarkdown = `## ${section.charAt(0).toUpperCase() + section.slice(1)}\nstubbed`;
      await page.route(`**/api/resumes/${RESUME_ID}/refine`, async (route: Route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              resumeId: RESUME_ID,
              section,
              updatedMarkdown: stubbedMarkdown,
              updatedAt: new Date().toISOString(),
            }),
          });
        }
        return route.continue();
      });

      await page.goto(`/tailor/${RESUME_ID}`);

      const preview = page.locator('pre[role="document"]');
      await expect(preview).toBeVisible();
      // Seeded anchor for the current section should be visible before refine.
      await expect(preview).toContainText(anchors[section]);

      // Open the Refine dialog.
      await page.getByRole('button', { name: 'Refine' }).click();
      await expect(page.getByRole('heading', { name: 'Refine Section' })).toBeVisible();

      // Select the target section.
      await page.locator('#refine-section').selectOption(section);
      await expect(page.locator('#refine-section')).toHaveValue(section);

      // Fill instruction.
      await page.locator('#refine-instruction').fill('stubbed instruction');

      // Submit and wait for the POST.
      const postPromise = page.waitForRequest(
        (req) => req.url().includes(`/api/resumes/${RESUME_ID}/refine`) && req.method() === 'POST'
      );
      await page.getByRole('button', { name: 'Submit' }).click();
      await postPromise;

      // Stubbed markdown now appears in preview.
      await expect(preview).toContainText('stubbed');

      // Original anchor for this section is gone.
      await expect(preview).not.toContainText(anchors[section]);

      // All other section anchors remain.
      for (const other of SECTIONS) {
        if (other !== section) {
          await expect(preview).toContainText(anchors[other]);
        }
      }

      // Transient status appeared.
      await expect(page.getByText('Section refined')).toBeVisible();

      expect(pageErrors).toEqual([]);

      // Unroute between iterations so stubs don't cross-contaminate.
      await page.unrouteAll();
    }
  });
});
