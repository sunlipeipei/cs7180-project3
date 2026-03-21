---
description: Generate and run end-to-end tests with Playwright. Creates test journeys, runs tests, captures screenshots/videos/traces, and uploads artifacts.
---

# E2E Command

This command invokes the **e2e-runner** agent to generate, maintain, and execute end-to-end tests using Playwright.

## What This Command Does

1. **Generate Test Journeys** - Create Playwright tests for user flows
2. **Run E2E Tests** - Execute tests across browsers
3. **Capture Artifacts** - Screenshots, videos, traces on failures
4. **Upload Results** - HTML reports and JUnit XML
5. **Identify Flaky Tests** - Quarantine unstable tests

## When to Use

Use `/e2e` when:
- Testing critical user journeys (resume generation, interactive editing, form auto-fill)
- Verifying multi-step flows work end-to-end
- Testing UI interactions and navigation
- Validating integration between frontend and backend (Claude API, document parsing)
- Preparing for production deployment

## How It Works

The e2e-runner agent will:

1. **Analyze user flow** and identify test scenarios
2. **Generate Playwright test** using Page Object Model pattern
3. **Run tests** across multiple browsers (Chrome, Firefox, Safari)
4. **Capture failures** with screenshots, videos, and traces
5. **Generate report** with results and artifacts
6. **Identify flaky tests** and recommend fixes

## Example Usage

```
User: /e2e Test the resume tailoring flow from job description input to .docx download

Agent (e2e-runner):
# E2E Test Generation: Resume Tailoring Flow

## Test Scenario Identified

**User Journey:** Paste Job Description → Upload Resume Template → Select Context Sources → Generate Tailored Resume → Download .docx

**Test Coverage:**
1. Navigate to resume tailoring page
2. Paste a job description
3. Upload a .docx resume template
4. Select GitHub repos and documents for context
5. Generate tailored resume
6. Verify generated content matches job requirements
7. Download .docx output

## Generated Test Code

```typescript
// e2e/resume/tailoring-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Resume Tailoring Flow', () => {
  test('user can generate a tailored resume from job description', async ({ page }) => {
    // 1. Navigate to tailoring page
    await page.goto('/')
    await expect(page).toHaveTitle(/BypassHire/)

    // 2. Paste job description
    await page.click('[data-testid="job-description-input"]')
    await page.fill('[data-testid="job-description-input"]',
      'Senior Software Engineer - Node.js, TypeScript, React required'
    )

    // 3. Upload resume template
    const fileInput = page.locator('[data-testid="resume-upload"]')
    await fileInput.setInputFiles('fixtures/sample-resume.docx')
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible()

    // Take screenshot of input state
    await page.screenshot({ path: 'artifacts/tailoring-input.png' })

    // 4. Select context sources
    await page.click('[data-testid="add-github-repo"]')
    await page.fill('[data-testid="repo-url"]', 'https://github.com/user/project')
    await page.click('[data-testid="confirm-repo"]')

    // 5. Generate tailored resume
    await page.click('[data-testid="generate-resume"]')

    // Wait for Claude API response (may take a few seconds)
    await page.waitForResponse(resp =>
      resp.url().includes('/api/generate') && resp.status() === 200,
      { timeout: 30000 }
    )

    await expect(page.locator('[data-testid="resume-preview"]')).toBeVisible()

    // 6. Verify generated content references job requirements
    const preview = page.locator('[data-testid="resume-preview"]')
    await expect(preview).toContainText(/Node\.js|TypeScript|React/)

    // Take screenshot of generated resume
    await page.screenshot({ path: 'artifacts/generated-resume.png' })

    // 7. Download .docx
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-docx"]'),
    ])
    expect(download.suggestedFilename()).toMatch(/\.docx$/)
  })

  test('shows validation error when no job description provided', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="generate-resume"]')
    await expect(page.locator('[data-testid="error-message"]')).toContainText('job description')
  })
})
```

## Running Tests

```bash
# Run the generated test
npx playwright test e2e/resume/tailoring-flow.spec.ts

Running 2 tests using 2 workers

  ✓  [chromium] › tailoring-flow.spec.ts:5:3 › user can generate a tailored resume (8.4s)
  ✓  [chromium] › tailoring-flow.spec.ts:52:3 › shows validation error (1.1s)

  2 passed (9.7s)

Artifacts generated:
- artifacts/tailoring-input.png
- artifacts/generated-resume.png
- playwright-report/index.html
```

## Test Report

```
╔══════════════════════════════════════════════════════════════╗
║                    E2E Test Results                          ║
╠══════════════════════════════════════════════════════════════╣
║ Status:     ✅ ALL TESTS PASSED                              ║
║ Total:      2 tests                                          ║
║ Passed:     2 (100%)                                         ║
║ Failed:     0                                                ║
║ Flaky:      0                                                ║
║ Duration:   9.7s                                             ║
╚══════════════════════════════════════════════════════════════╝

Artifacts:
📸 Screenshots: 2 files
📹 Videos: 0 files (only on failure)
🔍 Traces: 0 files (only on failure)
📊 HTML Report: playwright-report/index.html

View report: npx playwright show-report
```

✅ E2E test suite ready for CI/CD integration!
```

## Test Artifacts

When tests run, the following artifacts are captured:

**On All Tests:**
- HTML Report with timeline and results
- JUnit XML for CI integration

**On Failure Only:**
- Screenshot of the failing state
- Video recording of the test
- Trace file for debugging (step-by-step replay)
- Network logs
- Console logs

## Viewing Artifacts

```bash
# View HTML report in browser
npx playwright show-report

# View specific trace file
npx playwright show-trace artifacts/trace-abc123.zip

# Screenshots are saved in artifacts/ directory
open artifacts/search-results.png
```

## Flaky Test Detection

If a test fails intermittently:

```
⚠️  FLAKY TEST DETECTED: e2e/resume/tailoring-flow.spec.ts

Test passed 7/10 runs (70% pass rate)

Common failure:
"Timeout waiting for response from /api/generate"

Recommended fixes:
1. Increase timeout for Claude API calls: { timeout: 30000 }
2. Add explicit wait: await page.waitForSelector('[data-testid="resume-preview"]')
3. Check for race conditions in async generation flow
4. Mock Claude API responses for deterministic tests

Quarantine recommendation: Mark as test.fixme() until fixed
```

## Browser Configuration

Tests run on multiple browsers by default:
- ✅ Chromium (Desktop Chrome)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (optional)

Configure in `playwright.config.ts` to adjust browsers.

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/e2e.yml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload artifacts
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## BypassHire Critical Flows

Prioritize these E2E tests for BypassHire:

**🔴 CRITICAL (Must Always Pass):**
1. User can paste a job description and generate a tailored resume
2. User can upload a .docx resume template
3. User can download the generated resume as .docx
4. Context extraction from GitHub repos returns valid data
5. Generated resume content reflects job description requirements
6. No form submission occurs without explicit user confirmation (Phase 3)

**🟡 IMPORTANT:**
1. Interactive editing: user can select text and leave a comment for AI revision
2. AI processes inline comments and revises only the targeted section
3. Diff view shows changes between revision rounds
4. Multiple rounds of editing work correctly in a single session
5. Version history allows reverting to previous versions
6. Auto-fill correctly maps fields on Workday portals (Phase 3)

## Best Practices

**DO:**
- ✅ Use Page Object Model for maintainability
- ✅ Use data-testid attributes for selectors
- ✅ Wait for API responses, not arbitrary timeouts
- ✅ Test critical user journeys end-to-end
- ✅ Run tests before merging to main
- ✅ Review artifacts when tests fail

**DON'T:**
- ❌ Use brittle selectors (CSS classes can change)
- ❌ Test implementation details
- ❌ Run tests against production
- ❌ Ignore flaky tests
- ❌ Skip artifact review on failures
- ❌ Test every edge case with E2E (use unit tests)

## Important Notes

**CRITICAL for BypassHire:**
- E2E tests require the web app and backend API running (use `npm run dev` or equivalent)
- Tests that call the Claude API should mock responses for speed and determinism in CI
- Use fixture .docx files in `e2e/fixtures/` for resume template uploads
- Use longer timeouts for tests involving AI generation (Claude API can take 5-15 seconds)
- Never use real personal data in tests — use synthetic resumes and job descriptions

## Integration with Other Commands

- Use `/plan` to identify critical journeys to test
- Use `/tdd` for unit tests (faster, more granular)
- Use `/e2e` for integration and user journey tests
- Use `/code-review` to verify test quality

## Related Agents

This command invokes the `e2e-runner` agent provided by ECC.

For manual installs, the source file lives at:
`agents/e2e-runner.md`

## Quick Commands

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/resume/tailoring-flow.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug test
npx playwright test --debug

# Generate test code
npx playwright codegen http://localhost:3000

# View report
npx playwright show-report
```
