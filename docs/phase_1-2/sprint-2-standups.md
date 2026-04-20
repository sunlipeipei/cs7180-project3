# Sprint 2 Async Standups

**Sprint:** Apr 12–21, 2026  
**Team:** Lipeipei Sun (sunlipeipei) · Dako (iDako7 / dako7777777)

Both partners are distributed (different time zones, no shared office hours), so synchronous standups are not practical. Async standups are posted to the shared repo as a commit to this file or to the team Slack thread and summarized here. Each entry follows the Yesterday / Today / Blockers format used in the Sprint 1 standup log. Every "Yesterday" bullet cites a real commit SHA, PR number, or issue close event from the repository history — no fabricated work items.

---

## Standup Entries

### 2026-04-12 — Lipeipei Sun

**Yesterday:**
- Sprint 2 kicked off. Reviewed sprint planning doc merged via PR #47. Confirmed #18 (Clerk auth) and #22 (CI/CD) are closed from Sprint 1 — both merged Apr 4 (branch `feat/issue-18-clerk-auth`, tip `7b57720`; branch `feat/ci-cd-basic`, tip `96815e4`).
- Triaged open sprint 2 issues: assigned myself to #24 (CI/CD E2E + security stage), #25 (Gitleaks + security sub-agent), #26 (Playwright E2E critical journey), #28 (skills v2).

**Today:**
- Begin #26 — scope Playwright golden-path spec for the sign-in → upload PDF → tailor → download PDF journey; set up Playwright config if not already present.
- Review Dako's Phase 0 issue (#48) issue description to understand which API contracts the E2E tests will need to hit.

**Blockers:** Phase 0 not yet merged (Dako's work in progress). E2E spec must target final API shapes — will draft against the schema contract in `src/ai/schemas.ts` once Phase 0.5 lands.

---

### 2026-04-14 — Lipeipei Sun

**Yesterday:**
- Reviewed Phase 0 cleanup plan (issue #48). Confirmed SSRF hardening and Zod boundary guard are scope for Dako; no overlap with my CI work.
- Drafted structure for #24: identified that the existing 9-stage CI pipeline (from `feat/ci-cd-basic`) needs a 10th stage for Playwright E2E once Phase 1.E lands.
- Reviewed #25 scope: Gitleaks pre-commit hook + security sub-agent PR review + DoD PR template.

**Today:**
- Draft Playwright E2E test file for #26 — golden path stub (sign-in → new JD → profile ingest → tailor → PDF download). Block on `@playwright/test` already in devDeps from Sprint 1 CI pipeline.
- Start #28 skills v2: audit current `fix-issue` skill (`2edc9d5` on `feat/fix-issue-skill-v2`) against Sprint 2 patterns to identify gaps (branch verification, Prettier before commit already in v2 — what else?).

**Blockers:** None currently. Waiting on Phase 0.5 API contracts before writing assertions against response shapes.

---

### 2026-04-16 — Dako

**Yesterday:**
- Sprint 2 active coding started. Fixed Clerk→DB user mapping bug (P0 blocker identified in implementation plan §1.3 #1): commit `3629bb2` — map Clerk users to app records for JD/profile access.
- Annotated PRD implementation status (`0d533dc`) and fixed CI typecheck/format failures (`d5cb057`).
- Added architect agent, ADR skill, and commit-signal hooks to `.claude/` infra (`00c0ba6`).

**Today:**
- Kick off Phase 0 cleanup branch (#48): RED tests for User.id = clerkId collapse, SSRF safeguards, and Zod boundary on JD route.
- Sync planning docs + add react-components skill (`24989a1`), merge PR #47.
- Target: have Phase 0 RED tests committed today, GREEN tomorrow.

**Blockers:** None. Real Neon integration test credentials confirmed in `.env` — `DATABASE_URL_TEST` pointing to test branch.

---

### 2026-04-17 — Dako

**Yesterday:**
- PR #47 merged (`fbfc250`): sync planning docs, add react-components skill, ignore `.stitch/`.

**Today (active — commits landed throughout the day):**
- Phase 0 TDD RED tier: `779856a` (User.id = clerkId collapse), `5055bf6` (Zod CreateJdInput), `9a7f899` (SSRF safeguards) — all failing as required.
- Phase 0 GREEN tier: `5045333` (Zod wired to route), `189e9a0` (route handler), `4c58300` (deps: openai, unpdf, @react-pdf/renderer), `7b273a7` (SSRF-hardened JD URL fetch — DNS blocklist, timeout, size cap, redirect guard), `d56ffc8` (collapse User.id to Clerk ID, rename docxPath→pdfPath).
- Phase 0 post-green fixes: `8168c5f` (activate integration test tier with skipIf guard, closes #48 exit gate), `19556d0` (exclude `.claude/worktrees/**` from unit discovery), `cf4b448` (update implementation plan with Phase 0.5 decisions).
- Auth hardening: `9de4527` (dev-only Clerk bypass), `d9451c3` (unit tests for `src/lib/auth` + ESLint import guard), `9e0c854` (JSON errors on auth() failure), `d69dd25` (auto-upsert user on JD creation for local dev), `7d58352` (address PR #55 review — split ensureUser try/catch, hide DB errors).
- CI fixes: `2ec22c1`, `d0aeb91` (strip .js extensions from TS imports), `90f638a` (fix lint and typecheck CI failures).
- PR #55 merged (`2612421`): Phase 0 cleanup closes #48.
- PR #56 merged (`cf3df86`): dev-auth bypass.

**Blockers:** None — Phase 0 exit gate passed. Moving to Phase 0.5 tonight.

---

### 2026-04-17 — Lipeipei Sun

**Yesterday:**
- Reviewed PR #55 ([Phase-0] cleanup, issue #48) as it came up for review. Left code-review comments that triggered Dako's `7d58352` fix (split ensureUser try/catch, hide DB errors, remove duplicate tests).
- Continued drafting Playwright E2E spec for #26 locally — blocked on Phase 0.5 schema shapes not yet merged.

**Today:**
- Monitor PR #55, #56 merges. Once Phase 0.5 lands (#49), finalize `POST /api/profile/ingest` and `POST /api/tailor` request/response shapes for E2E assertions.
- Continue #28 skills v2 gap analysis: `fix-issue` skill v2 (`2edc9d5`) covers branch verify + prettier; need to add `/verify` invocation and C.L.E.A.R. PR body scaffolding.
- Review CI pipeline status for #24 — identify which stages are still missing after Phase 1.E lands.

**Blockers:** Phase 0.5 not yet merged. E2E spec assertions remain stubbed until API contracts are locked.

---

### 2026-04-18 — Dako

**Yesterday:** Phase 0 fully merged (PR #55 `2612421`). Phase 0.5 branch in progress overnight.

**Today (active — full Phase 0.5 through Phase 1.E in a single intensive session):**

Phase 0.5 — Flow & Contract (#49):
- `acdba00` + `3697152` (stage config, screens, docs), `a104943` (prettier unblock CI), `70d0c1d` (jest-dom matchers), `128d6cf` + `28710a8` (husky pre-push hook), `aa01436` (rebase — keep genuine deltas only). PR #57 merged (`945633f`), PR #58 merged (`0701a1d`). Closes #49.

Phase 1.A — Profile ingest (#50):
- RED: `93a61c2` (extractText reads PDF buffer).
- GREEN: `69443b0` (extractText with typed error contract), `55eeaa2` (OpenRouter client, ingest prompt, profile API routes), `1dc48e4` (wire profile page to /api/profile + Import-from-PDF).
- Review fixes: `5de413b` (tighten ingest guards, HIGH), `79744bb` + `c0e7b2d` (CI Node 22 polyfill for unpdf/pdfjs).
- Null-optional coverage: `a463638` (RED), `2908fca` (GREEN), `232e5c0` (integration), `4595647` (docs), `c98ecbd` (E2E), `a569160` (prettier). PR #59 merged (`551855d`). Closes #50.

Phase 1.B — Tailor engine (#51):
- RED: `8e4f9cb` (tailorResume spec + schema tightening).
- GREEN: `cd4a5fc` (single-shot tailor with JD injection defense), `8be35f3` (tailor route, resume repo, JD-by-id — userId-scoped), `6f80497` (wire dashboard Tailor flow to real API).
- Fixes: `ea2c079` (prettier), `7b374ba` (scope updateResume to userId; safeParse, HIGH), `81253ac` (split env files, dev:up shortcut), `6731f2e` (trust client source hint for JD URL routing). PR #60 merged (`553d83c`). Closes #51.

Phase 1.C — Refine (#52):
- RED: `92c3f7f` (refineResumeSection rewrites only target section).
- GREEN: `3016744`, `5348907` (POST /api/resumes/[resumeId]/refine — section-scoped).
- Fix: `0421f3f` (do not echo Zod enum taxonomy on 400, HIGH). Tests: `1361737` (integration + E2E, deferred smoke). PR #61 merged (`07d90b0`). Closes #52.

Phase 1.D — PDF export (#53):
- `22e06d7` (React-PDF template, render, route, UI wire-up). PR #62 merged (`0f7194c`). Closes #53.

Phase 1.E — E2E + polish (#54):
- `3ee8c59` (E2E golden path + empty/loading state coverage), `ebff9f4` (prettier). PR #64 merged (`e2b2158`). Closes #54.

Misc: `04c8b8c` (.gitignore updates), `2acdea7` (project PDF + docs enhancement).

**Blockers:** None. All Phase 0–1.E issues closed. Moving to documentation deliverables (#30, #31, #63).

---

### 2026-04-19 — Lipeipei Sun

**Yesterday:**
- Monitored the Phase 1.A–E PR merges as they landed throughout Apr 18. Reviewed PR #59 (profile ingest), PR #60 (tailor), PR #61 (refine), PR #62 (PDF), PR #64 (E2E) as code reviewer.
- Issue #26 (Playwright E2E critical journey) confirmed satisfied by `3ee8c59` + `ebff9f4` — PR #64 covers the golden-path spec. Closed #26 (closed 2026-04-19T01:28).

**Today:**
- Close out remaining sprint 2 cleanup: confirm deferred issues #6, #7, #8, #9–#16 are marked closed per Variant C scope trim (all closed 2026-04-19T01:27–01:28).
- Begin #28 skills v2 final iteration — document usage evidence for `fix-issue` v2 and the new `react-components` skill added in `24989a1`.
- Review #24 (CI/CD E2E stage) and #25 (security gates) — assess scope remaining given sprint end Apr 21.

**Blockers:** #24 and #25 require Vercel deploy URL to be stable; currently open pending final sprint deliverables.

---

### 2026-04-20 — Lipeipei Sun

**Yesterday:**
- Confirmed #26 closed and all deferred Variant C issues closed.
- Worked on #28 skills v2 — closed 2026-04-20T21:23 (#28 state: CLOSED).

**Today:**
- Opened PR #65 (`phase-1/landing-page-style-update`): redesign home page to match app design system.
  - `2ae8881` — style(landing): redesign home page to match app design system
  - `35adaec` — style(landing): apply prettier formatting
  - `38f9d09` — chore: ignore `.playwright-mcp/` snapshot directory
  - `03ce6c0` — fix(auth): redirect to `/dashboard` after sign-in and sign-up
- PR #65 opened 2026-04-20T21:56, pending review.

**Blockers:** #24 (CI/CD E2E stage) and #25 (security gates) remain open; submitting as best-effort before deadline.

---

### 2026-04-20 — Dako

**Yesterday:**
- All Phase 1.A–E issues (#48–#54) merged and closed. All Phase 1 code on `main`.

**Today:**
- Working on sprint documentation deliverables: sprint-2 standups (#32/#63), rubric evidence checklist (#63), and blog post outline (#31).
- Reviewing PR #65 (Lipeipei's landing page redesign).
- Finalizing README architecture diagram (#30) and any remaining #27 parallel worktree evidence.

**Blockers:** #24 (Vercel deploy URL needed for README) still open. Documenting as best-effort artifact — worktree branch names in git log serve as the evidence for #27.

---

## Mid-Sprint Sync — 2026-04-17

Both partners checked in asynchronously on Apr 17 as the Phase 0 gate. Summary of team state at that point:

**Dako:** Phase 0 cleanup (#48) fully landed by end of day — 15+ commits across RED→GREEN→fixes, PR #55 merged. Zod boundary on JD route active, SSRF hardening in production, User.id = Clerk ID migration applied to Neon. Integration test tier activated with `skipIf` guard. Dev-auth bypass (PR #56) merged to unblock local development without Clerk webhook. Moving directly into Phase 0.5 that evening.

**Lipeipei:** Sprint 1 carryovers (#18, #22) already closed Apr 4 — no action needed. Reviewed PR #55 as code reviewer; review comment triggered `7d58352` (split ensureUser try/catch). Working on Playwright E2E spec (#26) and skills v2 (#28) in parallel; both blocked on Phase 0.5 API contracts not yet merged.

**Risk at sync point:** Phase 0.5 + Phase 1.A–E (5 sub-phases) still ahead for a single owner (Dako). Mitigation: Zod schemas pre-locked in Phase 0.5 will eliminate per-phase design iteration; each Phase 1 sub-phase estimated at 0.5–1 day. Timeline tight but achievable before Apr 19 feature freeze.

**Outcome:** Phase 0.5 and all Phase 1.A–E issues closed on Apr 18 — one day ahead of the Apr 19 target.
