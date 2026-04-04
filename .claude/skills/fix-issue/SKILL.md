---
name: fix-issue
description: End-to-end workflow for implementing a GitHub issue in BypassHire. Creates a branch, follows TDD, opens a PR with C.L.E.A.R. review and AI disclosure. Usage: /fix-issue <issue-number>
version: 2
---

# Fix Issue Workflow

Given a GitHub issue number, execute the complete BypassHire development workflow:
branch → plan → TDD → build-fix → code-review → PR.

## Usage

```
/fix-issue 5
/fix-issue 18
```

## Steps (execute in order)

### 1. Read the issue

- Fetch the issue from GitHub: owner `sunlipeipei`, repo `cs7180-project3`
- Extract: title, acceptance criteria, labels, sprint milestone
- Summarize requirements in 2–3 sentences before proceeding

### 2. Create a branch

- Branch name format: `feat/issue-<number>-<short-slug>` (e.g. `feat/issue-5-jd-intake`)
- Checkout from latest `main`:
  ```
  git checkout main && git pull origin main && git checkout -b <branch>
  ```
- **Verify** the branch is active with `git branch --show-current` before writing any code.
  If it does not match the expected branch name, stop and fix before continuing.

### 3. Plan

- Restate acceptance criteria as a checklist
- Identify files to create/modify
- Call out any security concerns (Zod validation, userId scoping, SSRF risks per `docs/security.md`)
- List new dependencies needed
- **Identify new environment variables** the feature requires. For each one, produce a checklist:
  ```
  New env vars for this issue:
  - [ ] Add to .env.example (with placeholder value and comment)
  - [ ] Add to GitHub Actions secrets (for CI jobs that need them)
  - [ ] Add to Vercel environment variables (preview + production)
  - [ ] Add to .github/workflows/ci.yml if E2E or build jobs need them
  ```
- If the feature adds auth, middleware, or external API keys that CI will need at runtime,
  note which CI jobs (build, e2e, integration-test) require which secrets.
- **STOP and present the plan. Wait for user confirmation before writing code.**

### 4. TDD — RED phase

- Write ALL tests first (unit + integration stubs)
- Before committing, run `npx prettier --write .` to auto-format
- Commit with message: `test: failing tests for <feature> (#<issue>)`
- Run tests and confirm they fail: `npm test`

### 5. TDD — GREEN phase

- Write minimum code to make tests pass
- Before committing, run `npx prettier --write .` to auto-format
- Commit: `feat: implement <feature> (#<issue>)`
- Run: `npm test` — all must pass

### 6. TDD — REFACTOR phase

- Clean up without breaking tests
- Run: `npm run lint && npm run format:check && npx tsc --noEmit`
  - If `format:check` fails, run `npx prettier --write .` then re-stage and retry
- Commit: `refactor: clean up <feature> (#<issue>)`

### 7. Update CI if new env vars were introduced

If the plan step identified new env vars needed by CI:

- Add them to the relevant jobs in `.github/workflows/ci.yml`:
  - Build job: `NEXT_PUBLIC_*` vars must be present at build time (Next.js embeds them)
  - E2E job: any vars needed for the server to start or tests to run
  - Integration-test job: any DB or service vars
- Reference secrets with `${{ secrets.SECRET_NAME }}`
- Commit: `ci: add <feature> env vars to CI pipeline (#<issue>)`

### 8. Coverage check

- Run: `npm run test:coverage`
- Confirm thresholds: 70% overall, 90% on `src/profile/`
- If below threshold, add missing tests before proceeding

### 9. Local verification

Run all of these and confirm they pass before opening the PR:

```
npm run lint
npm run format:check
npx tsc --noEmit
npm test
npm run build
```

### 10. Open PR

- Push branch: `git push -u origin <branch>`
- Open PR to `main` with:
  - Title: `feat: <description> (#<issue>)`
  - Body includes: summary, C.L.E.A.R. review, AI disclosure, `Closes #<issue>`
  - C.L.E.A.R.: Context / Limitations / Errors / Alternatives / Risks
- **Monitor CI after opening.** If any job fails, fix it on the same branch before considering done.
  Common CI-only failures to watch for:
  - Prettier formatting (run `npx prettier --write .` and commit)
  - Missing secrets in CI jobs (add to `ci.yml` and GitHub Actions secrets)
  - E2E server startup timeout (ensure auth env vars are passed to build + start steps)

## Constraints

- **Never skip the RED phase.** Tests must exist and fail before implementation starts.
- **Never commit secrets.** Check `.env` is not staged before every commit.
- **Always scope DB queries to `userId`** from Clerk `auth()` — never from request body.
- **Validate all input with Zod** before it reaches the DB or Claude API.
- **No auto-submit** in Phase 3 features — explicit user confirmation required (FR-3.5).
- Do not consider the issue done until CI passes on the PR — local green is necessary but not sufficient.
- Branch protection: PRs require the CI pipeline to pass before merge.

## Expected Output

At the end of this skill, you will have:

- [ ] A feature branch with commits showing RED → GREEN → REFACTOR
- [ ] All tests passing with coverage thresholds met
- [ ] `npm run build` passing with zero type errors
- [ ] An open PR with C.L.E.A.R. review and AI disclosure
- [ ] The GitHub issue linked via `Closes #<issue>` in the PR body
- [ ] CI pipeline passing on the PR (all jobs green)
- [ ] `.env.example` updated if new env vars were introduced
- [ ] `ci.yml` updated if new env vars are needed at CI build/runtime
