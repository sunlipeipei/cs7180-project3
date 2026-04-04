---
name: fix-issue
description: End-to-end workflow for implementing a GitHub issue in BypassHire. Creates a branch, follows TDD, opens a PR with C.L.E.A.R. review and AI disclosure. Usage: /fix-issue <issue-number>
version: 1
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
- Checkout from latest `main`: `git checkout main && git pull origin main && git checkout -b <branch>`
- Confirm the branch is active before writing any code

### 3. Plan
- Restate acceptance criteria as a checklist
- Identify files to create/modify
- Call out any security concerns (Zod validation, userId scoping, SSRF risks per `docs/security.md`)
- List new dependencies needed
- **STOP and present the plan. Wait for user confirmation before writing code.**

### 4. TDD — RED phase
- Write ALL tests first (unit + integration stubs)
- Commit with message: `test: failing tests for <feature> (#<issue>)`
- Run tests and confirm they fail: `npm test`

### 5. TDD — GREEN phase
- Write minimum code to make tests pass
- Commit: `feat: implement <feature> (#<issue>)`
- Run: `npm test` — all must pass

### 6. TDD — REFACTOR phase
- Clean up without breaking tests
- Run: `npm run lint && npm run format:check && npx tsc --noEmit`
- Commit: `refactor: clean up <feature> (#<issue>)`

### 7. Coverage check
- Run: `npm run test:coverage`
- Confirm thresholds: 70% overall, 90% on `src/profile/`
- If below threshold, add missing tests before proceeding

### 8. Open PR
- Push branch: `git push -u origin <branch>`
- Open PR to `main` with:
  - Title: `feat: <description> (#<issue>)`
  - Body includes: summary, C.L.E.A.R. review, AI disclosure, closes #<issue>
  - C.L.E.A.R.: Context / Limitations / Errors / Alternatives / Risks

## Constraints

- **Never skip the RED phase.** Tests must exist and fail before implementation starts.
- **Never commit secrets.** Check `.env` is not staged before every commit.
- **Always scope DB queries to `userId`** from Clerk `auth()` — never from request body.
- **Validate all input with Zod** before it reaches the DB or Claude API.
- **No auto-submit** in Phase 3 features — explicit user confirmation required (FR-3.5).
- Do not open the PR until `npm run lint`, `npx tsc --noEmit`, and `npm test` all pass.
- Branch protection: PRs require the CI pipeline to pass before merge.

## Expected Output

At the end of this skill, you will have:
- [ ] A feature branch with commits showing RED → GREEN → REFACTOR
- [ ] All tests passing with coverage thresholds met
- [ ] `npm run build` passing with zero type errors
- [ ] An open PR with C.L.E.A.R. review and AI disclosure
- [ ] The GitHub issue linked via `Closes #<issue>` in the PR body
