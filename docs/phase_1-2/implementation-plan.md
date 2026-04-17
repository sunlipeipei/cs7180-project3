# Phase 1 Implementation Plan — Tailoring Engine (Minimum Viable)

**Owner:** Dako (solo on Phase 1)
**Target:** 2026-04-21 submission
**Parent design:** `docs/architecture/phase-1.md`
**Status:** DRAFT — Stitch/HTML strategy resolved 2026-04-16 (§6.2); a few scope trims still noted inline.

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

- **D1.** Change `User.id` to equal `clerkId` (drop the CUID). Eliminates Bug #1 without threading an extra lookup through every repo. Trade-off: DB row ID is no longer a CUID, but `clerkId` is already unique and opaque.
- **D2.** Drop `JobDescription.title` / `.company` columns (per bug #4 fix option b). The agent reads `content` directly; simpler model.
- **D3.** PDF output not persisted — `GET /api/pdf/[resumeId]` renders on demand from `Resume.content`. No blob storage, no `pdfPath` column needed. **If we keep `pdfPath` nullable, zero harm, and it leaves headroom.** Recommend: rename to `pdfPath` (decision #4) but leave always-null for V1.
- **D4.** Refine flow: editor uses plain `<textarea>` showing the resume as markdown + a "Render PDF" button that opens a new tab. Defer `@uiw/react-md-editor` split preview. Saves one dep + component work.
- **D5.** No streaming of agent progress in V1 — spinner + status text only (matches architecture §12 Q1 recommendation).
- **D6.** Single structured-output call for `/api/tailor` (no multi-tool loop) if we're time-pressed. Architecture §6.2 says the tailor agent uses 4 tools; if we build the orchestrator and it eats a day we don't have, fall back to a single large prompt that returns a full `TailoredResume` and skip the tool registry. **Decision deferred to Phase 1.3 — assess when we start building.**

---

## 2. Phase 0 — Cleanup & Prep (est. 0.5–1 day)

Goal: green codebase, no known bugs, all deps installed, one migration applied. Do this in a single branch `phase-0/cleanup` with one PR — small, reviewable, unlocks everything.

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

### 2.6 Gate

- [ ] `npm test` passes (all existing + new bug-fix tests)
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` clean
- [ ] CI green on the Phase 0 PR

---

## 3. Phase 1 — Tailoring Engine

Sequencing is **critical path first**. Each milestone ends with a working slice you can demo.

### 3.1 Milestone A — Profile ingestion (est. 1 day)

**Slice goal:** User uploads PDF, sees parsed MasterProfile JSON on screen.

**Deliverables:**
- `src/ingestion/pdf.ts` — `extractText(bytes: Uint8Array): Promise<string>` using `unpdf`
- `src/ai/client.ts` — OpenRouter client singleton (`openai` npm, `baseURL` from env, model `openai/gpt-5.1`)
- `src/ai/prompts.ts` — `INGEST_PROFILE_PROMPT` (system prompt: "extract resume into JSON matching schema")
- `src/ai/schemas.ts` — re-export `MasterProfileSchema` for tool I/O; add `TailoredResumeSchema` here too (land early so later milestones can import)
- `app/api/profile/ingest/route.ts` — POST multipart, 10 MB cap, calls extractText → Claude structured output → Zod parse → return
- `app/api/profile/route.ts` — GET/PUT passthrough to `profileRepository`
- `app/profile/page.tsx` — file input, submit, JSON preview, "Looks good, save" button (PUT /api/profile)

**Design source for Profile page — Stitch MCP (no existing mockup):**
1. `mcp__stitch__list_projects` → grab the BypassHire project id
2. `mcp__stitch__generate_screen_from_text` with prompt describing Profile page (PDF upload dropzone, parsed MasterProfile JSON preview, "Looks good, save" button; same palette as existing pages — Space Grotesk headline, Inter body, `#4ad7f3` accent, glass-morphism on AI moments)
3. `mcp__stitch__get_screen` → retrieve `htmlCode.downloadUrl` + `screenshot.downloadUrl`
4. `bash ~/.agents/skills/react-components/scripts/fetch-stitch.sh "<htmlUrl>" .stitch/designs/profile.html` (same for screenshot with `=w<width>` suffix)
5. Port to `app/profile/page.tsx` using the CSS custom properties already in `app/globals.css` (inline `style={{ fontFamily: 'var(--font-headline)' }}` pattern matches `app/dashboard/new/page.tsx`)

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

### 3.2 Milestone B — Tailor endpoint (est. 1.5 days)

**Slice goal:** User picks an existing JD, clicks "Tailor," sees the tailored resume JSON.

**Decision point (per D6):** build the tool-loop orchestrator or single-shot? Default to **single-shot** first — lowest risk. If output quality is poor, upgrade to the loop in a follow-up commit.

**Single-shot path (V1.0):**
- `src/ai/tailor.ts` — exports `tailorResume(profile, jd): Promise<TailoredResume>`. One `client.chat.completions.create` call with `response_format: { type: 'json_schema', ... }` using `TailoredResumeSchema`. System prompt wraps JD in `<job_description>...</job_description>` delimiters (prompt-injection defense).
- `src/lib/resumeRepository.ts` — `createResume(userId, jdId, content)`, `getResume(id, userId)`, `updateResume(id, userId, content)`.
- `app/api/tailor/route.ts` — POST `{ jdId }`, auth, load profile + JD, call `tailorResume`, save Resume, return `{ resumeId, resume }`. Set `export const maxDuration = 60`.

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

### 3.3 Milestone C — Editor + refine (est. 1 day)

**Slice goal:** User edits the tailored resume, adds HTML comments, clicks "Refine," sees regenerated bullets.

**Simplification per D4:** plain `<textarea>` + "Render PDF" button. No split preview.

**Deliverables:**
- `src/ai/serializeResume.ts` — `TailoredResume → markdown`. Deterministic, round-trip-friendly. Bullet IDs as `<!-- id:abc123 -->` markers.
- `src/ai/parseInlineComments.ts` — scans markdown for `<!-- ... -->` comments, correlates with bullet IDs, returns `{ bulletId, comment, currentText }[]`.
- `src/ai/refine.ts` — `refineSections(resume, commentedMarkdown): Promise<TailoredResume>`. Either one Claude call with all affected bullets (simpler) or a loop per bullet (better quality). Start simple.
- `app/api/refine/[resumeId]/route.ts` — POST `{ markdown }`, auth + ownership check, call `refineSections`, UPDATE Resume (no new row — decision #3), return `{ resume }`.
- `app/tailor/[resumeId]/page.tsx` — fetches resume, renders markdown in `<textarea>`, "Render PDF" button opens `/api/pdf/[resumeId]` in a new tab, "Refine" button POSTs markdown.

**Design source:** port from `stitch_bypasshire_prd_v1.0/resume_tailoring_bypasshire/code.html` (committed mockup). Use tokens from `app/globals.css`; follow the inline-style pattern in `app/dashboard/new/page.tsx`.

**TDD evidence (rubric hit #3):**
- RED: `src/ai/__tests__/parseInlineComments.test.ts` — fixtures: bullet with single comment, bullet with multi-line comment, comment on non-bullet text (ignored), malformed comment (ignored), two comments on same bullet.
- GREEN: implement parser.

**Acceptance criteria:**
- Markdown round-trip is lossless for an uncommented resume (`serialize(parse(md)) == md`).
- Refine touches only commented bullets — uncommented bullets are byte-identical pre/post.
- User's edits outside bullets (e.g. adding a paragraph to summary) are persisted as-is (no refine needed there).
- Concurrent refine calls for same resume serialize (or last-writer-wins; document which).

### 3.4 Milestone D — PDF output (est. 0.5 day)

**Slice goal:** Button click → downloadable PDF file.

**Deliverables:**
- `src/pdf/ResumeTemplate.tsx` — `@react-pdf/renderer` component, one-column layout, Inter font, respects Stitch design spirit where PDF-reasonable.
- `src/pdf/render.ts` — `renderResumeToPdf(resume: TailoredResume): Promise<Uint8Array>`.
- `app/api/pdf/[resumeId]/route.ts` — GET, auth + ownership, render on demand, stream bytes with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="resume.pdf"`.

**Tests:**
- Unit: given a fixture `TailoredResume`, `renderResumeToPdf` returns a Uint8Array ≥ 1 KB starting with `%PDF-`.
- E2E: see §4.

**Acceptance criteria:**
- PDF downloads, opens in macOS Preview, shows resume content.
- Cross-user request → 404.
- Render takes <5s for a typical resume.

### 3.5 Milestone E — E2E + polish (est. 0.5 day)

**E2E test (Playwright — rubric requires ≥1):**
- `e2e/tailor-flow.spec.ts`
  - Sign in (test user via Clerk test mode or bypass)
  - Navigate to /profile, upload fixture PDF
  - Go to /dashboard/new, paste fixture JD
  - Land on /tailor/[id], assert tailored content contains keywords from JD
  - Add `<!-- make this shorter -->` to one bullet, click Refine
  - Assert bullet changed
  - Click "Render PDF," assert download happens, content-type is `application/pdf`, body is non-empty

**Polish:**
- Dashboard (`/dashboard`) lists user's profile status, JDs, resumes — port from `stitch_bypasshire_prd_v1.0/dashboard_bypasshire/code.html`
- JD intake (`/dashboard/new`) already ported from `stitch_bypasshire_prd_v1.0/new_project_setup_bypasshire/code.html` by Peipei — review for parity with committed mockup, fix any drift
- Landing page gets real copy
- Loading states on every async action
- Empty states (no profile yet, no JDs yet)

---

## 4. Testing strategy

| Test layer | Target | How |
|---|---|---|
| Unit | 80%+ new code | Vitest, mock OpenRouter + Prisma |
| Integration | Hit real Neon for repos (resume, jd) | `*.integration.test.ts` |
| E2E | 1 end-to-end golden path (§3.5) | Playwright, against dev server |
| Coverage | ≥70% overall, 90% on `src/profile/` (keep), 80% on `src/ai/` (new) | Vitest coverage thresholds |

**TDD discipline:** each milestone has a named RED → GREEN commit pair. After the green commit, refactor in a third commit if needed. CI must stay green after every commit.

---

## 5. Security checklist (per milestone)

Reviewed against `docs/security.md`:

| Gate | Milestone A | B | C | D |
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

## 6. Open questions

### 6.1 Single-shot vs. tool-loop for tailor (decision D6)
Default to single-shot structured-output. Revisit if output quality is poor. **Deferred to Milestone B start.**

### 6.2 Stitch MCP verification — RESOLVED 2026-04-16
**Outcome:** hybrid approach.

**Verification evidence:**
- `mcp__stitch__list_projects` / `list_screens` / `get_screen` all return valid JSON
- `fetch-stitch.sh` downloaded the Dashboard HTML (19533 bytes, 343 lines) and screenshot (248856 bytes) successfully
- Committed HTML in `stitch_bypasshire_prd_v1.0/dashboard_bypasshire/code.html` is **byte-identical** to the MCP-served version — no drift, no need to re-download
- 4 committed mockups cover 3 of 4 Phase 1 pages (Dashboard, New Project Setup = JD intake, Resume Tailoring); the 4th committed mockup is Auto-Fill Preview (Phase 3, out of scope)

**Decision:**
- **Dashboard, JD intake, Tailor** → port from `stitch_bypasshire_prd_v1.0/*/code.html` directly (faster, version-controlled, already aligned with `app/globals.css` tokens)
- **Profile page (missing)** → generate a new Stitch screen via `mcp__stitch__generate_screen_from_text`, fetch with `fetch-stitch.sh`, port to `app/profile/page.tsx` (see Milestone A)
- `.stitch/designs/` stays untracked (added to `.gitignore` during Phase 0); committed mockups in `stitch_bypasshire_prd_v1.0/` are the source of truth

### 6.3 Refine: one Claude call or per-bullet loop
Start with one Claude call that sees all commented bullets. If quality suffers (e.g., agent collapses multiple bullets), switch to per-bullet. Mark as follow-up if needed.

### 6.4 Profile edit UX
For V1, render parsed `MasterProfile` as read-only JSON with a big `<textarea>` for manual JSON editing. Zod validates on save. Structured form is post-V1.

---

## 7. Rubric coverage (running tally)

| Rubric area | Pre-Phase-1 | Post-Phase-1 target |
|---|---|---|
| CLAUDE.md & memory | ✅ Comprehensive, @imports present | ✅ |
| Custom skills (≥2) | ✅ Many in `.claude/skills/` | ✅ |
| Hooks (≥2) | ✅ 4 hooks in `settings.json` | ✅ |
| MCP (≥1) | ⚠️ `.mcp.json` deleted locally; archived copy + HW5 report as evidence | Re-add `.mcp.json` if rubric scorer wants live config |
| Agents (≥1) | ✅ `.claude/agents/` | ✅ |
| Parallel development | ⚠️ Peipei's PRs visible | Dako's Phase 0/1 branches add to this |
| Writer/reviewer + C.L.E.A.R. | ⚠️ One PR so far (#40) | Each milestone PR uses C.L.E.A.R. + AI disclosure |
| TDD (≥3 features) | Partial (profile module) | 3 explicit RED→GREEN pairs in §3.1, §3.2, §3.3 |
| E2E (≥1 test) | Zero | §3.5 adds one |
| Coverage ≥70% | Current: high (119 tests passing) | Maintained |
| CI/CD pipeline | ✅ 8 stages | ✅ |
| Security gates (≥4) | Secrets, npm audit, OWASP doc, DoD criteria | + Gitleaks pre-commit, + SAST sub-agent (nice-to-have if time) |

**Risk:** the MCP rubric item. The deletion of `.mcp.json` is intentional per your decision, but if a scorer expects a live `.mcp.json` at the repo root, we should either (a) restore a minimal one, or (b) clearly document in the README that MCP is demonstrated in `docs/archive/`. **Decide before submission.**

---

## 8. Sequencing & risk

**Happy path (4.5 days of coding):**
```
Phase 0         ── 1 day
Milestone A     ── 1 day   (profile ingest)
Milestone B     ── 1.5 day (tailor)
Milestone C     ── 1 day   (refine)
Milestone D     ── 0.5 day (PDF)
Milestone E     ── 0.5 day (E2E + polish)
```
Plus deploy verification, blog post, video — separate.

**If behind schedule:**
- Cut C's inline-comment refine. "Refine" button regenerates the whole resume instead. Loses one TDD feature — replace with a different one (e.g., Zod-guarded profile editing).
- Cut D's custom PDF template — dump `JSON.stringify(resume, null, 2)` into a single-page PDF. Ugly but submittable.
- Cut E's Playwright E2E detail — one happy-path click-through only.

**If ahead of schedule:**
- Upgrade tailor to tool-loop (V1.1)
- Add streaming agent status via Server-Sent Events
- Build structured profile edit form
- Add Gitleaks pre-commit hook (security gate bonus)

---

## 9. Branch / PR strategy

- `phase-0/cleanup` — single PR with all Phase 0 fixes
- `phase-1/milestone-a-profile-ingest` — PR
- `phase-1/milestone-b-tailor` — PR
- `phase-1/milestone-c-refine` — PR
- `phase-1/milestone-d-pdf` — PR
- `phase-1/milestone-e-e2e` — PR

Every PR:
- C.L.E.A.R. self-review comment
- AI disclosure (% AI-generated, tool used, human review)
- Links to the GitHub issue if one exists
- Green CI before merge

---

## 10. What this plan is NOT

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

# Per milestone
git checkout -b phase-1/milestone-a-profile-ingest
# ... write failing test, commit (RED)
# ... implement, commit (GREEN)
# ... refactor, commit
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
```
