# Phase 1 Implementation Plan — Tailoring Engine (Minimum Viable)

**Owner:** Dako (solo on Phase 1)
**Target:** 2026-04-21 submission
**Parent design:** `docs/architecture/phase-1.md`
**Status:** DRAFT — Stitch/HTML strategy resolved 2026-04-16 (§7.2); restructured 2026-04-17 into 3 phases (0, 0.5, 1) with 7 issues total. See §1.6 for the 2026-04-17 decision log.

---

## 0. Summary & Outline

### 0.1 One-paragraph summary

Ship the BypassHire tailoring engine in ~4.5 days across **3 phases / 7 GitHub issues**. **Phase 0** cleans up P0 bugs (userId FK, SSRF), lands the deps + schema migration, and exits on a manual UAT against a real DB. **Phase 0.5** is a new flow-and-contract phase: generate/port every Phase 1 screen against hardcoded fixtures and fully populate `src/ai/schemas.ts` — this substitutes for the PRD we never wrote and front-loads all UX risk. **Phase 1** (A–E) then ships Profile ingest, Tailor endpoint, Refine editor, PDF render, and an E2E Playwright test; with the schema already locked, each sub-phase is pure backend + frontend wire-up (fixtures → real API). Coverage ≥70%, three explicit RED→GREEN TDD pairs for the rubric, integration tests against a real Neon branch, and one Playwright golden-path E2E.

### 0.2 Phase map

| # | Phase | Est. | Exit gate |
|---|---|---|---|
| 1 | [Phase 0 — Cleanup & UAT](#2-phase-0--cleanup--prep-est-051-day) | 1 day | UAT checklist ticked against real Neon |
| 2 | [Phase 0.5 — Flow & Contract](#3-phase-05--flow--contract-est-115-days-new-phase--decision-l4) | 1–1.5 day | All screens click-through on fixtures; `src/ai/schemas.ts` complete |
| 3 | [Phase 1.A — Profile ingest](#41-phase-1a--profile-ingestion-est-05-day) | 0.5 day | User uploads PDF, sees parsed JSON from real API |
| 4 | [Phase 1.B — Tailor](#42-phase-1b--tailor-endpoint-est-1-day) | 1 day | `POST /api/tailor` returns valid `TailoredResume` |
| 5 | [Phase 1.C — Refine](#43-phase-1c--editor--refine-est-05-day) | 0.5 day | Inline comments drive bullet regeneration |
| 6 | [Phase 1.D — PDF](#44-phase-1d--pdf-output-est-05-day) | 0.5 day | Button → downloadable PDF |
| 7 | [Phase 1.E — E2E + polish](#45-phase-1e--e2e--polish-est-05-day) | 0.5 day | Playwright golden-path passes |

### 0.3 Key decisions at a glance

- **3 phases, 7 issues, 1 issue per phase.** Sub-PR split per issue deferred (L1, L6).
- **Phase 0.5 is new.** Validates UX + locks Zod schemas before any backend work (L4).
- **Per-phase loop inside Phase 1:** schema is already locked → backend (RED→GREEN + route) → frontend wire-up. No Stitch work inside Phase 1 (L5).
- **Integration test tier activated in Phase 0.** Real Neon branch via `DATABASE_URL_TEST` — never mocked (L3).
- **Phase 0 UAT gate.** Manual browser click-through against real DB is the real exit signal, not green unit tests (L2).
- **Dev pattern per issue** lives in `notes/dev-patterns.md`, not this plan (L7).



**Companion references (not in this doc):**
- `docs/phase_1-2/notes/dev-patterns.md` — per-issue Claude Code sub-agent pattern
- `docs/phase_1-2/uat-phase-0.md` — Phase 0 UAT checklist (created during Phase 0)
- `docs/phase_1-2/flows/*.md` — Phase 0.5 flow notes (created during Phase 0.5)
- `docs/architecture/phase-1.md` — parent design doc this plan executes against

---

## 1. Context

### 1.1 What's shipped (verified 2026-04-16)

| Area | State | Evidence |
|---|---|---|
| Clerk auth (middleware + provider) | ✅ Works | `middleware.ts:10`, `app/layout.tsx:12` |
| Clerk webhook → DB User upsert | ✅ Works | `app/api/webhooks/clerk/route.ts:43` |
| Prisma schema (User/Profile/JobDescription/Resume) | ✅ Present | `prisma/schema.prisma` |
| Profile module (schema, merge, types, errors) | ✅ Complete + tested | `src/profile/` |
| Repositories: user, profile, jobDescription | ✅ Exist (see 1.3 #1 for FK bug) | `src/lib/`, `src/lib/jobDescription/` |
| JD intake: text OR URL | ✅ Works end-to-end | `app/dashboard/new/page.tsx`, `app/api/job-descriptions/route.ts` |
| Tests passing | ✅ 119/119, 10 files | `npm test` run 18:55, 799ms |
| CI/CD pipeline (8 stages) | ✅ Runs | `.github/workflows/ci.yml` |
| Design tokens (Stitch palette in Tailwind v4) | ✅ Wired | `app/globals.css` |
| Stitch HTML mockups (4 pages + DESIGN.md) | ✅ Reference material | `stitch_bypasshire_prd_v1.0/` |
| Claude Code infra (agents, hooks, skills) | ✅ Rich setup | `.claude/` |

### 1.2 Gaps vs. `docs/architecture/phase-1.md`

| Item | Status | Impact |
|---|---|---|
| Profile upload page (`/profile`) | Missing | P1 feature — profile must exist before tailoring |
| Tailor page (`/tailor/[resumeId]`) | Missing | P1 feature |
| `POST /api/profile/ingest` (PDF → MasterProfile) | Missing | Entry point to profile creation |
| `GET/PUT /api/profile` | Missing | Profile review/edit after ingestion |
| `POST /api/tailor` | Missing | Core tailoring endpoint |
| `POST /api/refine/[resumeId]` | Missing | Inline-comment refine loop |
| `GET /api/pdf/[resumeId]` | Missing | Output delivery |
| `src/ai/` (client, orchestrator, prompts, tools) | Missing | Entire AI layer |
| `src/lib/resumeRepository.ts` | Missing | Needed for tailor/refine persistence |
| `src/pdf/` (ResumeTemplate, render) | Missing | PDF output |
| `src/ingestion/pdf.ts` (unpdf wrapper) | Missing | PDF input |
| Deps: `openai`, `unpdf`, `@react-pdf/renderer`, `@uiw/react-md-editor` | Not installed | Blocker |
| `Resume.docxPath` → `pdfPath` | Not renamed | Phase 0 task |
| `TailoredResumeSchema` (Zod) | Not defined | Phase 0 task |

### 1.3 Bugs found (severity-ranked)

1. **[P0 — BLOCKER] userId mismatch: Clerk ID used as DB FK.**
   - `app/api/job-descriptions/route.ts:9` pulls `userId` from `auth()` (Clerk ID, e.g. `user_abc`), passes it directly to `saveJobDescription(userId, ...)` which writes it to `JobDescription.userId` — but that column FKs to `User.id` (a CUID).
   - Same pattern in `profileRepository.saveProfile` (`src/lib/profileRepository.ts:24`).
   - Tests mock Prisma, so this is invisible in CI. Will fail on any real DB write.
   - **Fix:** All repos must first resolve `User.id` from `clerkId` (add `getUserByClerkId(clerkId)` call) OR rename `User.clerkId` to `User.id` and drop the separate CUID. Simpler for V1: change schema so `User.id = clerkId`, drop the CUID. One migration, all repos work as-is.

2. **[P0 — SECURITY] SSRF in JD URL fetcher.**
   - `src/lib/jobDescription/parseJobDescription.ts:33` — `fetch(trimmed)` with only protocol check. Attacker can POST `{ input: "http://169.254.169.254/latest/meta-data/" }` to hit AWS metadata from the Vercel runtime, or any internal network IP.
   - Violates your own `docs/security.md` A10.
   - **Fix:** After DNS resolution, reject private/loopback/link-local IPs (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, ::1, fc00::/7). Cap response size via streaming read (e.g. 5MB max). Add 10s timeout via `AbortSignal.timeout(10_000)`. Deny redirects to private IPs.

3. **[P1] No Zod validation at JD API boundary.**
   - `app/api/job-descriptions/route.ts:14-24` uses manual type checks. Violates CLAUDE.md convention "validate all input with Zod."
   - **Fix:** Define `CreateJdInput = z.object({ input: z.string().trim().min(1).max(60000) })`, replace manual check.

4. **[P2] JD parser doesn't extract `title`/`company`.**
   - `JobDescription.title` and `JobDescription.company` are null for every row saved by `parseJobDescription`. Architecture's `readJobDescription` tool returns `{ title, company, content }` — the agent will get `null` fields.
   - **Fix options:** (a) Use Claude in `parseJobDescription` to extract title/company. (b) Drop columns from the tool output and let the agent read from `content`. Recommend (b) — simpler, keeps one LLM call at tailor time.

5. **[P3] Dashboard routing dead-end.**
   - `/dashboard/new` redirects to `/dashboard?jd=${id}` but `/dashboard` ignores the query param and shows the static "Ready to tailor?" page.
   - Not a blocker — will be resolved when `/dashboard` is rebuilt to list JDs + resumes.

### 1.4 Locked decisions (from 2026-04-16 discussion)

| # | Decision | Applies to |
|---|---|---|
| 1 | Add a Phase 0 for cleanup before feature work | This plan |
| 2 | **Resolved (2026-04-16):** hybrid — use committed HTML in `stitch_bypasshire_prd_v1.0/` for Dashboard, JD intake, Tailor (byte-identical to MCP-served versions); use Stitch MCP `generate_screen_from_text` to create a NEW design for the missing Profile page | §6.2, Milestones A/C/E |
| 3 | No resume versioning for V1 — refine overwrites the row | Schema + refine route |
| 4 | Rename `docxPath` → `pdfPath` via `prisma migrate` | Phase 0 |
| 5 | Plan doc lives at `docs/phase_1-2/implementation-plan.md` | This file |
| 6 | Dako is solo on Phase 1 | Sequencing |
| 7 | `openai` SDK → OpenRouter base URL → `openai/gpt-5.1`; key in `.env` as `OPENROUTER_API_KEY` | `src/ai/client.ts` |

### 1.5 Derivative decisions (proposed — confirm or push back)

> Superseded in part by §1.6. Kept for history.

- **D1.** Change `User.id` to equal `clerkId` (drop the CUID). Eliminates Bug #1 without threading an extra lookup through every repo. Trade-off: DB row ID is no longer a CUID, but `clerkId` is already unique and opaque.
- **D2.** Drop `JobDescription.title` / `.company` columns (per bug #4 fix option b). The agent reads `content` directly; simpler model.
- **D3.** PDF output not persisted — `GET /api/pdf/[resumeId]` renders on demand from `Resume.content`. No blob storage, no `pdfPath` column needed. **If we keep `pdfPath` nullable, zero harm, and it leaves headroom.** Recommend: rename to `pdfPath` (decision #4) but leave always-null for V1.
- **D4.** Refine flow: editor uses plain `<textarea>` showing the resume as markdown + a "Render PDF" button that opens a new tab. Defer `@uiw/react-md-editor` split preview. Saves one dep + component work.
- **D5.** No streaming of agent progress in V1 — spinner + status text only (matches architecture §12 Q1 recommendation).
- **D6.** Single structured-output call for `/api/tailor` (no multi-tool loop) if we're time-pressed. Architecture §6.2 says the tailor agent uses 4 tools; if we build the orchestrator and it eats a day we don't have, fall back to a single large prompt that returns a full `TailoredResume` and skip the tool registry. **Decision deferred to Phase 1.3 — assess when we start building.**

### 1.6 Decisions locked 2026-04-17

| # | Decision | Rationale |
|---|---|---|
| L1 | Structure: **3 phases, 7 issues total** — Phase 0 (cleanup), Phase 0.5 (flow & contract), Phase 1 (A–E). Use "Phases" uniformly; no "milestones" terminology. | Clearer hierarchy; maps 1:1 to GitHub issues. |
| L2 | Phase 0 exits with a **UAT gate** (manual click-through on real Neon), not just green unit tests. | The P0 FK bug survived CI because Prisma was mocked. Real-DB UAT is the only reliable signal. |
| L3 | **Integration test tier activated in Phase 0.** `*.integration.test.ts` hits a real Neon branch for repositories. Unit tests keep mocking; integration layer is new. | Prevents mock-only pollution (Q3 decision). Catches FK/constraint bugs before feature work piles on. |
| L4 | **Phase 0.5 — Flow & Contract** inserted as its own phase (1–1.5 days). Validates all Phase 1 screens against fixtures via Stitch MCP, fully populates `src/ai/schemas.ts`, writes `docs/phase_1-2/flows/*.md`. | Front-loads UX risk; eliminates "design iteration inside every feature PR"; schemas-in-one-pass prevents drift across A–E. |
| L5 | **Per-feature loop for Phase 1.A–E:** schema is already locked (from 0.5) → backend (RED→GREEN + route) → frontend wire-up (swap fixtures for real fetch). No Stitch generation inside Phase 1. | Tight backend-leading slice inside each phase now that flow is validated. |
| L6 | **Sub-PR split per issue is deferred.** One GitHub issue per phase; sub-PRs decided when the issue opens. | Premature to size PRs before seeing what a migration/refactor actually touches. |
| L7 | **Dev pattern per issue is not fixed in this plan.** See `docs/phase_1-2/notes/dev-patterns.md` for the per-issue recommendation (orchestrator vs. sequential vs. targeted sub-agents). | Different phases have different blast radiuses; one pattern does not fit all. |

---

## 2. Phase 0 — Cleanup & Prep (est. 0.5–1 day)

**Goal:** green codebase, no known bugs, all deps installed, one migration applied, **existing features verified end-to-end against a real DB via UAT**. Exit when Phase 0 UAT checklist passes.

Do this on branch `phase-0/cleanup`. Sub-PR split deferred — may be 1 PR or 3 depending on how the FK migration shakes out.

### 2.1 Bug fixes

- [ ] **Fix userId FK mismatch.** Migration: change `User.id @default(cuid())` to `User.id` (string, no default) and populate from Clerk webhook's `event.data.id`. Update `upsertUser` to write `id` not `clerkId`. Drop the separate `clerkId` column (or keep as alias for now). Update all tests.
  - Alternative path if that migration is too disruptive: add `getUserByClerkId` lookup inside each repo's write path. Slower, but no schema change.
- [ ] **Fix SSRF.** Extract URL fetch into `src/lib/jobDescription/safeFetch.ts`:
  ```
  - Validate URL scheme (http/https)
  - DNS resolve hostname, reject private/loopback/link-local IPs
  - AbortSignal.timeout(10_000)
  - Cap response body at 5 MB via streaming
  - redirect: 'manual' — re-validate on each hop
  ```
  Unit tests for each rejection case.
- [ ] **Add Zod at JD boundary.** `CreateJdInput` schema, replace manual validation in `route.ts:14-24`.

### 2.2 Schema migration

- [ ] `prisma/schema.prisma`:
  - `Resume.docxPath` → `pdfPath` (nullable, unused in V1)
  - Drop `JobDescription.title` and `.company` (decision D2) — or keep and ignore
  - (Depending on D1 choice) restructure `User.id`
- [ ] `npm run db:migrate` — commit the migration file
- [ ] Regenerate Prisma client (`npm run db:generate`)
- [ ] Update any TypeScript that references dropped fields

### 2.3 Dependencies

- [ ] `npm install openai unpdf @react-pdf/renderer`
- [ ] (Optional if D4 confirmed) skip `@uiw/react-md-editor`
- [ ] Verify `next.config.js` — add `serverExternalPackages: ['unpdf', '@react-pdf/renderer']` if build complains

### 2.4 Environment

- [ ] Add to `.env.example`:
  - `OPENROUTER_API_KEY=`
  - `OPENROUTER_MODEL=openai/gpt-5.1`
  - `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- [ ] Add same keys to Vercel project env (production + preview)
- [ ] Confirm `.env` locally has all three

### 2.5 Misc cleanup

- [ ] Decide fate of `.clerk/`, `tsconfig.tsbuildinfo` (gitignore or commit)
- [ ] Add `.stitch/` to `.gitignore` (local Stitch MCP download cache, not source of truth)
- [ ] Commit the staged deletions (`.mcp.json`, PDF, old tdd-workflow-guide.md) with a clean message — or revert if we want to keep `.mcp.json` for the rubric (NOTE: MCP is already satisfied by `docs/archive/.mcp.json.bak` + the HW5 report; deletion is safe)
- [ ] `/dashboard/new` redirect → route to `/profile` if user has no profile yet

### 2.6 Integration test tier (new — decision L3)

- [ ] Add `*.integration.test.ts` convention. Config reads `DATABASE_URL_TEST` (a dedicated Neon branch).
- [ ] First integration tests land in Phase 0 for `userRepository`, `profileRepository`, `jobDescriptionRepository` — exercise the FK fix against a real DB.
- [ ] CI stage: run integration tests against a Neon preview branch (or a scratch branch cleaned per-run).
- [ ] Unit tests continue to mock Prisma; integration tests never mock the DB.

### 2.7 Automated gate

- [ ] `npm test` passes (unit)
- [ ] `npm run test:integration` passes (new)
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` clean
- [ ] CI green on the Phase 0 PR(s)

### 2.8 UAT gate (new — decision L2)

Manual click-through in a real browser against real Neon. Capture as `docs/phase_1-2/uat-phase-0.md` (checklist format).

- [ ] Sign up → new `User` row visible in Neon
- [ ] Sign in → lands on a sensible page
- [ ] Sign out → redirected appropriately
- [ ] `/dashboard/new` JD paste → `JobDescription` row saved with correct `User.id` FK
- [ ] `/dashboard/new` JD URL → row saved, content fetched, FK correct
- [ ] SSRF rejections verified: `http://169.254.169.254/latest/meta-data/`, `http://localhost`, `http://127.0.0.1`, redirect-to-private-IP — all return 4xx without leaking internal data
- [ ] JD URL timeout works (>10s URL is aborted)
- [ ] Zod validation on JD boundary rejects empty/oversized input

**Phase 0 does not exit until this checklist is ticked end-to-end.**

---

## 3. Phase 0.5 — Flow & Contract (est. 1–1.5 days, new phase — decision L4)

**Goal:** validate every Phase 1 screen against fixtures before any backend work; produce the complete `src/ai/schemas.ts` and one flow note per screen. This phase is the PRD substitute.

Branch: `phase-0.5/flow-and-contract`. Sub-PR split deferred.

### 3.1 Screens to generate/port (wired to fixtures, no API calls)

- `/profile` — PDF upload dropzone + parsed `MasterProfile` JSON preview + save button. Design via Stitch MCP `generate_screen_from_text`.
- `/tailor/[resumeId]` — resume markdown in a `<textarea>`, "Render PDF" button, "Refine" button. Design ported from `stitch_bypasshire_prd_v1.0/resume_tailoring_bypasshire/code.html`.
- `/dashboard` — lists user's profile status, JDs, resumes. Port from `stitch_bypasshire_prd_v1.0/dashboard_bypasshire/code.html`.
- `/dashboard/new` — already ported by Peipei. Review for parity, fix drift.

Every screen wired to hardcoded fixtures in `src/fixtures/` (or similar). No `fetch()` calls. No backend.

### 3.2 Contract deliverables

- [ ] `src/ai/schemas.ts` — complete. `MasterProfileSchema` re-export, `TailoredResumeSchema`, ingest request/response, refine request/response, tailor request/response.
- [ ] `docs/phase_1-2/flows/profile.md` — user story, screen states (empty, loading, parsed, error), data contract link.
- [ ] `docs/phase_1-2/flows/tailor.md` — same structure.
- [ ] `docs/phase_1-2/flows/refine.md` — same structure. **Most UX-risky screen — spend the most time here.**
- [ ] `docs/phase_1-2/flows/dashboard.md` — same structure.

### 3.3 Exit gate

- [ ] All four screens click-through-able against fixtures.
- [ ] Dako signs off: "I've navigated the whole app end-to-end on fake data and the flow feels right."
- [ ] `src/ai/schemas.ts` imported by both the page code (for fixture typing) and left ready for backend consumers.
- [ ] Every downstream Phase 1.A–E starts with the schema already defined.

### 3.4 What this phase is NOT

- Not pixel-perfect polish — that's Phase 1.E.
- Not backend work — no routes, no Prisma writes, no Claude calls.
- Not a design doc — the flow notes are 5–10 lines each, not specs.

---

## 4. Phase 1 — Tailoring Engine

Sequencing is **critical path first**. Each phase ends with a working slice you can demo.

**Per-phase loop (decision L5):** schema is already locked from Phase 0.5. Work order inside each phase is: backend (RED→GREEN + route) → frontend wire-up (swap fixtures for real `fetch('/api/...')`). No Stitch generation, no design iteration — screens already exist from Phase 0.5.

### 4.1 Phase 1.A — Profile ingestion (est. 0.5 day)

**Slice goal:** User uploads PDF on `/profile` (already built in 0.5), real API parses it, page shows real parsed JSON.

**Deliverables:**
- `src/ingestion/pdf.ts` — `extractText(bytes: Uint8Array): Promise<string>` using `unpdf`
- `src/ai/client.ts` — OpenRouter client singleton (`openai` npm, `baseURL` from env, model `openai/gpt-5.1`)
- `src/ai/prompts.ts` — `INGEST_PROFILE_PROMPT` (system prompt: "extract resume into JSON matching schema")
- `app/api/profile/ingest/route.ts` — POST multipart, 10 MB cap, calls extractText → Claude structured output → Zod parse → return
- `app/api/profile/route.ts` — GET/PUT passthrough to `profileRepository`
- Wire `app/profile/page.tsx` from fixture to real `/api/profile/ingest`

**TDD evidence (rubric hit #1):**
- RED: `src/ingestion/__tests__/pdf.test.ts` — a fixture PDF (check in 1 small sample) → expect `extractText` returns non-empty string containing known words.
- GREEN: implement `extractText`.
- Commit both, separately. Git shows the red-then-green pair.

**Acceptance criteria:**
- Signed-in user can upload a PDF ≤10 MB.
- Page shows parsed JSON (pretty-printed).
- Clicking save persists to `Profile.data`.
- Malformed PDF returns 400 without a stack trace.
- User not signed in → 401.
- File >10 MB → 413.
- Token count logged; PDF bytes NOT logged.

### 4.2 Phase 1.B — Tailor endpoint (est. 1 day)

**Slice goal:** User picks an existing JD, clicks "Tailor," real API returns a persisted `TailoredResume` that renders on the tailor page (already built in 0.5).

**Decision point (per D6):** build the tool-loop orchestrator or single-shot? Default to **single-shot** first — lowest risk. If output quality is poor, upgrade to the loop in a follow-up commit.

**Single-shot path (V1.0):**
- `src/ai/tailor.ts` — exports `tailorResume(profile, jd): Promise<TailoredResume>`. One `client.chat.completions.create` call with `response_format: { type: 'json_schema', ... }` using `TailoredResumeSchema` (already defined in 0.5). System prompt wraps JD in `<job_description>...</job_description>` delimiters (prompt-injection defense).
- `src/lib/resumeRepository.ts` — `createResume(userId, jdId, content)`, `getResume(id, userId)`, `updateResume(id, userId, content)`.
- `app/api/tailor/route.ts` — POST `{ jdId }`, auth, load profile + JD, call `tailorResume`, save Resume, return `{ resumeId, resume }`. Set `export const maxDuration = 60`.
- Wire the "Tailor" trigger in the existing UI from fixture to real `/api/tailor`.

**Tool-loop path (V1.1, if time):**
- `src/ai/orchestrator.ts` — generic `runAgent({ systemPrompt, userMessage, tools, maxIterations })`
- `src/ai/tools/` — `readMasterProfile`, `readJobDescription`, `draftResumeSection`, `finalizeResume`
- `tailorResume` becomes a thin wrapper calling `runAgent`

**TDD evidence (rubric hit #2):**
- RED: `src/ai/__tests__/tailor.test.ts` — mock OpenRouter client; assert it's called with (a) system prompt containing `<job_description>`, (b) `response_format` set, (c) returned JSON is Zod-validated.
- GREEN: implement `tailorResume`.

**Acceptance criteria:**
- Given a saved profile + JD, `POST /api/tailor { jdId }` returns a valid `TailoredResume`.
- JD content in the prompt is delimiter-wrapped.
- Zod parse failure triggers one retry with error appended (per architecture §12 Q3); second failure returns 502.
- Resume row persisted with `userId` scoped to session.
- User B cannot tailor User A's JD (404, not 403 — avoid info leak).
- Token counts logged; full prompt/response NOT logged.

### 4.3 Phase 1.C — Editor + refine (est. 0.5 day)

**Slice goal:** User edits the tailored resume on the existing editor page, adds HTML comments, clicks "Refine," real API returns regenerated bullets.

**Simplification per D4:** plain `<textarea>` + "Render PDF" button. No split preview. UX already validated in Phase 0.5.

**Deliverables:**
- `src/ai/serializeResume.ts` — `TailoredResume → markdown`. Deterministic, round-trip-friendly. Bullet IDs as `<!-- id:abc123 -->` markers.
- `src/ai/parseInlineComments.ts` — scans markdown for `<!-- ... -->` comments, correlates with bullet IDs, returns `{ bulletId, comment, currentText }[]`.
- `src/ai/refine.ts` — `refineSections(resume, commentedMarkdown): Promise<TailoredResume>`. Either one Claude call with all affected bullets (simpler) or a loop per bullet (better quality). Start simple.
- `app/api/refine/[resumeId]/route.ts` — POST `{ markdown }`, auth + ownership check, call `refineSections`, UPDATE Resume (no new row — decision #3), return `{ resume }`.
- Wire `app/tailor/[resumeId]/page.tsx` from fixture to real `/api/refine/[resumeId]` and `/api/pdf/[resumeId]`.

**TDD evidence (rubric hit #3):**
- RED: `src/ai/__tests__/parseInlineComments.test.ts` — fixtures: bullet with single comment, bullet with multi-line comment, comment on non-bullet text (ignored), malformed comment (ignored), two comments on same bullet.
- GREEN: implement parser.

**Acceptance criteria:**
- Markdown round-trip is lossless for an uncommented resume (`serialize(parse(md)) == md`).
- Refine touches only commented bullets — uncommented bullets are byte-identical pre/post.
- User's edits outside bullets (e.g. adding a paragraph to summary) are persisted as-is (no refine needed there).
- Concurrent refine calls for same resume serialize (or last-writer-wins; document which).

### 4.4 Phase 1.D — PDF output (est. 0.5 day)

**Slice goal:** Button click → downloadable PDF file.

**Deliverables:**
- `src/pdf/ResumeTemplate.tsx` — `@react-pdf/renderer` component, one-column layout, Inter font, respects Stitch design spirit where PDF-reasonable.
- `src/pdf/render.ts` — `renderResumeToPdf(resume: TailoredResume): Promise<Uint8Array>`.
- `app/api/pdf/[resumeId]/route.ts` — GET, auth + ownership, render on demand, stream bytes with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="resume.pdf"`.

**Tests:**
- Unit: given a fixture `TailoredResume`, `renderResumeToPdf` returns a Uint8Array ≥ 1 KB starting with `%PDF-`.
- E2E: see §5.

**Acceptance criteria:**
- PDF downloads, opens in macOS Preview, shows resume content.
- Cross-user request → 404.
- Render takes <5s for a typical resume.

### 4.5 Phase 1.E — E2E + polish (est. 0.5 day)

**E2E test (Playwright — rubric requires ≥1):**
- `e2e/tailor-flow.spec.ts`
  - Sign in (test user via Clerk test mode or bypass)
  - Navigate to /profile, upload fixture PDF
  - Go to /dashboard/new, paste fixture JD
  - Land on /tailor/[id], assert tailored content contains keywords from JD
  - Add `<!-- make this shorter -->` to one bullet, click Refine
  - Assert bullet changed
  - Click "Render PDF," assert download happens, content-type is `application/pdf`, body is non-empty

**Polish (design already done in 0.5 — this is state/copy polish only):**
- Loading states on every async action
- Empty states (no profile yet, no JDs yet)
- Landing page gets real copy
- Review any drift between Phase 0.5 fixture screens and real-API screens

---

## 5. Testing strategy

| Test layer | Target | How |
|---|---|---|
| Unit | 80%+ new code | Vitest, mock OpenRouter + Prisma |
| Integration | Hit real Neon for repos (user, profile, jd, resume) — activated in Phase 0 (decision L3) | `*.integration.test.ts` using `DATABASE_URL_TEST` |
| E2E | 1 end-to-end golden path (§4.5) | Playwright, against dev server |
| Coverage | ≥70% overall, 90% on `src/profile/` (keep), 80% on `src/ai/` (new) | Vitest coverage thresholds |

**TDD discipline:** each Phase 1 phase has a named RED → GREEN commit pair. After the green commit, refactor in a third commit if needed. CI must stay green after every commit.

---

## 6. Security checklist (per Phase 1 sub-phase)

Reviewed against `docs/security.md`:

| Gate | 1.A | 1.B | 1.C | 1.D |
|---|---|---|---|---|
| A01 — `auth()` called before DB | ✅ | ✅ | ✅ | ✅ |
| A01 — queries scoped to session `userId` | ✅ | ✅ | ✅ | ✅ |
| A02 — no secrets in repo | ✅ (env) | ✅ | ✅ | ✅ |
| A03 — Zod at boundaries | ✅ (multipart) | ✅ (body) | ✅ (markdown size cap) | ✅ (id param) |
| A03 — prompt injection delimiters | — | ✅ (`<job_description>`) | ✅ (`<user_comments>`) | — |
| A08 — Zod re-validation on DB reads | ✅ | ✅ | ✅ | ✅ |
| A09 — log model + tokens, not content | ✅ | ✅ | ✅ | ✅ |
| A10 — no user URLs fetched | ✅ | ✅ | ✅ | ✅ |

---

## 7. Open questions

### 7.1 Single-shot vs. tool-loop for tailor (decision D6)
Default to single-shot structured-output. Revisit if output quality is poor. **Deferred to Phase 1.B start.**

### 7.2 Stitch MCP verification — RESOLVED 2026-04-16
**Outcome:** hybrid approach, executed during Phase 0.5.

**Verification evidence:**
- `mcp__stitch__list_projects` / `list_screens` / `get_screen` all return valid JSON
- `fetch-stitch.sh` downloaded the Dashboard HTML (19533 bytes, 343 lines) and screenshot (248856 bytes) successfully
- Committed HTML in `stitch_bypasshire_prd_v1.0/dashboard_bypasshire/code.html` is **byte-identical** to the MCP-served version — no drift, no need to re-download
- 4 committed mockups cover 3 of 4 Phase 1 pages (Dashboard, New Project Setup = JD intake, Resume Tailoring); the 4th committed mockup is Auto-Fill Preview (Phase 3, out of scope)

**Decision:**
- **Dashboard, JD intake, Tailor** → port from `stitch_bypasshire_prd_v1.0/*/code.html` directly during Phase 0.5
- **Profile page (missing)** → generate a new Stitch screen via `mcp__stitch__generate_screen_from_text`, fetch with `fetch-stitch.sh`, port during Phase 0.5
- `.stitch/designs/` stays untracked (added to `.gitignore` during Phase 0); committed mockups in `stitch_bypasshire_prd_v1.0/` are the source of truth

### 7.3 Refine: one Claude call or per-bullet loop
Start with one Claude call that sees all commented bullets. If quality suffers (e.g., agent collapses multiple bullets), switch to per-bullet. Mark as follow-up if needed.

### 7.4 Profile edit UX
For V1, render parsed `MasterProfile` as read-only JSON with a big `<textarea>` for manual JSON editing. Zod validates on save. Structured form is post-V1.

---

## 8. Rubric coverage (running tally)

| Rubric area | Pre-Phase-1 | Post-Phase-1 target |
|---|---|---|
| CLAUDE.md & memory | ✅ Comprehensive, @imports present | ✅ |
| Custom skills (≥2) | ✅ Many in `.claude/skills/` | ✅ |
| Hooks (≥2) | ✅ 4 hooks in `settings.json` | ✅ |
| MCP (≥1) | ⚠️ `.mcp.json` deleted locally; archived copy + HW5 report as evidence | Re-add `.mcp.json` if rubric scorer wants live config |
| Agents (≥1) | ✅ `.claude/agents/` | ✅ |
| Parallel development | ⚠️ Peipei's PRs visible | Dako's Phase 0/1 branches add to this |
| Writer/reviewer + C.L.E.A.R. | ⚠️ One PR so far (#40) | Each phase PR uses C.L.E.A.R. + AI disclosure |
| TDD (≥3 features) | Partial (profile module) | 3 explicit RED→GREEN pairs in §4.1, §4.2, §4.3 |
| E2E (≥1 test) | Zero | §4.5 adds one |
| Coverage ≥70% | Current: high (119 tests passing) | Maintained |
| CI/CD pipeline | ✅ 8 stages | ✅ |
| Security gates (≥4) | Secrets, npm audit, OWASP doc, DoD criteria | + Gitleaks pre-commit, + SAST sub-agent (nice-to-have if time) |

**Risk:** the MCP rubric item. The deletion of `.mcp.json` is intentional per your decision, but if a scorer expects a live `.mcp.json` at the repo root, we should either (a) restore a minimal one, or (b) clearly document in the README that MCP is demonstrated in `docs/archive/`. **Decide before submission.**

---

## 9. Sequencing & risk

**Happy path (~4.5 days of coding):**
```
Phase 0         ── 1 day      (cleanup + UAT gate)
Phase 0.5       ── 1–1.5 day  (flow & contract — Stitch + schemas)
Phase 1.A       ── 0.5 day    (profile ingest — backend + wire-up)
Phase 1.B       ── 1 day      (tailor)
Phase 1.C       ── 0.5 day    (refine)
Phase 1.D       ── 0.5 day    (PDF)
Phase 1.E       ── 0.5 day    (E2E + polish)
```
Phase 0.5 adds 1–1.5 days up front but shrinks every Phase 1 phase by ~0.5 day, so total is roughly flat. Plus deploy verification, blog post, video — separate.

**If behind schedule:**
- Cut 1.C's inline-comment refine. "Refine" button regenerates the whole resume instead. Loses one TDD feature — replace with a different one (e.g., Zod-guarded profile editing).
- Cut 1.D's custom PDF template — dump `JSON.stringify(resume, null, 2)` into a single-page PDF. Ugly but submittable.
- Cut 1.E's Playwright E2E detail — one happy-path click-through only.
- Phase 0.5 can compress to 0.5 day if flows feel obvious mid-sitting — don't force the full 1.5 day if the click-through is clean on first pass.

**If ahead of schedule:**
- Upgrade tailor to tool-loop (V1.1)
- Add streaming agent status via Server-Sent Events
- Build structured profile edit form
- Add Gitleaks pre-commit hook (security gate bonus)

---

## 10. Issue / Branch / PR strategy

**7 GitHub issues, 1:1 with phases (decision L1, L6):**

| # | Phase | Branch |
|---|---|---|
| 1 | Phase 0 — Cleanup & UAT | `phase-0/cleanup` |
| 2 | Phase 0.5 — Flow & Contract | `phase-0.5/flow-and-contract` |
| 3 | Phase 1.A — Profile ingest | `phase-1/a-profile-ingest` |
| 4 | Phase 1.B — Tailor | `phase-1/b-tailor` |
| 5 | Phase 1.C — Refine | `phase-1/c-refine` |
| 6 | Phase 1.D — PDF | `phase-1/d-pdf` |
| 7 | Phase 1.E — E2E + polish | `phase-1/e-e2e` |

**Sub-PR split per issue is deferred** (decision L6). Each issue may produce 1–3 PRs depending on what it touches; decide when opening the issue.

Every PR:
- C.L.E.A.R. self-review comment
- AI disclosure (% AI-generated, tool used, human review)
- Links to the GitHub issue
- Green CI before merge

---

## 11. What this plan is NOT

- Not a sprint doc — skip the velocity/points ceremony
- Not a design doc — that's `docs/architecture/phase-1.md`; this plan executes against it
- Not Phase 2 or 3 — GitHub repo ingestion, Chrome extension, screening Qs are out of scope for this submission

---

## Appendix A — Commands cheat sheet

```bash
# Phase 0
git checkout -b phase-0/cleanup
npm install openai unpdf @react-pdf/renderer
npm run db:migrate -- --name phase_0_rename_docx_to_pdf
npm test && npm run build

# Phase 0.5
git checkout -b phase-0.5/flow-and-contract
# ... generate/port screens, wire to fixtures
# ... fill in src/ai/schemas.ts
# ... write docs/phase_1-2/flows/*.md

# Per Phase 1 sub-phase
git checkout -b phase-1/a-profile-ingest
# ... write failing test, commit (RED)
# ... implement, commit (GREEN)
# ... refactor, commit
# ... wire frontend from fixture to real API
git push -u origin HEAD
gh pr create --title "..." --body "..."
```

## Appendix B — Files that will be created

```
src/
  ai/
    client.ts
    prompts.ts
    schemas.ts
    tailor.ts
    refine.ts
    serializeResume.ts
    parseInlineComments.ts
    orchestrator.ts            (optional, V1.1)
    tools/                     (optional, V1.1)
      index.ts
      readMasterProfile.ts
      readJobDescription.ts
      draftResumeSection.ts
      finalizeResume.ts
      reviseSection.ts
    __tests__/
      tailor.test.ts
      refine.test.ts
      serializeResume.test.ts
      parseInlineComments.test.ts
  ingestion/
    pdf.ts
    __tests__/
      pdf.test.ts
  pdf/
    ResumeTemplate.tsx
    render.ts
    __tests__/
      render.test.ts
  lib/
    resumeRepository.ts
    jobDescription/
      safeFetch.ts             (Phase 0 SSRF fix)
    __tests__/
      resumeRepository.test.ts

app/
  profile/
    page.tsx
  tailor/
    [resumeId]/
      page.tsx
  api/
    profile/
      ingest/
        route.ts
      route.ts
    tailor/
      route.ts
    refine/
      [resumeId]/
        route.ts
    pdf/
      [resumeId]/
        route.ts

e2e/
  tailor-flow.spec.ts
  fixtures/
    sample-resume.pdf
    sample-jd.txt

prisma/
  migrations/
    YYYYMMDDHHMMSS_phase_0_schema_cleanup/
      migration.sql

docs/
  phase_1-2/
    uat-phase-0.md               (Phase 0 UAT checklist)
    flows/                       (Phase 0.5 flow notes)
      profile.md
      tailor.md
      refine.md
      dashboard.md
    notes/                       (personal reference, not rubric-facing)
      dev-patterns.md
```
