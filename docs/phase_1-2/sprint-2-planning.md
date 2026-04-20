# Sprint 2 Planning

**Sprint dates:** Apr 12–21, 2026
**Sprint goal:** Ship Phase 1 tailoring engine end-to-end (Phase 0 cleanup → Phase 0.5 flow & contract → Phase 1.A–E profile/tailor/refine/PDF/E2E), close Sprint 1 carryovers (#18 Clerk auth, #22 CI/CD), advance Claude Code mastery evidence (skills v2, writer/reviewer PRs, worktree evidence), complete security gates, and deliver all documentation deliverables by the Apr 21 submission deadline.

---

## Team

| Member       | GitHub                     | Role                                                                   |
| ------------ | -------------------------- | ---------------------------------------------------------------------- |
| Lipeipei Sun | sunlipeipei                | Full-stack + Claude Code infrastructure (CI/CD, security gates, E2E)  |
| Dako         | iDako7 / dako7777777       | Phase 1 tailoring engine (owner), documentation                        |

---

## Issue List with Story Points

### Closed during Sprint 2

| #   | Title                                                                           | Assignee  | Points | Closed         | Notes                                |
| --- | ------------------------------------------------------------------------------- | --------- | ------ | -------------- | ------------------------------------ |
| #18 | [S1-2] Authentication with Clerk (job seeker user role)                         | Lipeipei  | 5      | Apr 4, 2026    | Sprint 1 carryover; closed early S2  |
| #22 | [S1-6] Basic CI/CD: lint + typecheck + unit tests                               | Lipeipei  | 5      | Apr 4, 2026    | Sprint 1 carryover; closed early S2  |
| #26 | [S2-3] Playwright E2E test: critical user journey (sign in → generate resume)   | Lipeipei  | 5      | Apr 19, 2026   |                                      |
| #28 | [S2-5] Custom skills v1→v2 iteration + usage evidence                           | Both      | 3      | Apr 20, 2026   |                                      |
| #48 | [Phase-0] Cleanup & UAT — FK fix, SSRF, Zod, schema migration, integration tests | Dako    | 8      | Apr 17, 2026   |                                      |
| #49 | [Phase-0.5] Flow & Contract — Stitch screens, fixture wiring, AI schemas        | Dako      | 5      | Apr 18, 2026   |                                      |
| #50 | [Phase-1.A] Profile ingest — PDF parsing, POST /api/profile/ingest              | Dako      | 5      | Apr 19, 2026   |                                      |
| #51 | [Phase-1.B] Tailor engine — Claude API single-shot, POST /api/tailor            | Dako      | 8      | Apr 19, 2026   |                                      |
| #52 | [Phase-1.C] Refine — inline comments, POST /api/refine/[resumeId]               | Dako      | 5      | Apr 19, 2026   |                                      |
| #53 | [Phase-1.D] PDF export — React-PDF template, GET /api/pdf/[resumeId]            | Dako      | 5      | Apr 19, 2026   |                                      |
| #54 | [Phase-1.E] E2E + polish — Playwright golden path, empty/loading states         | Dako      | 5      | Apr 19, 2026   |                                      |
| #5  | FR-1.1: Accept job description as input (text or URL)                           | (none)    | —      | Apr 5, 2026    | Closed in Sprint 1; confirmed closed |
| #6  | FR-1.2: Accept user resume as style template (.docx)                            | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #7  | FR-1.3: Context retrieval from GitHub repos and project documents               | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #8  | FR-1.4 + FR-1.5: Generate tailored resume and output as .docx                  | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #9  | FR-2.1: Web-based resume editing interface                                      | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #10 | FR-2.2 + FR-2.3: Inline comment and targeted AI section revision                | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #11 | FR-2.4: Multi-round iterative AI editing                                        | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #12 | FR-2.5 + FR-2.6: Diff view and accept/reject AI changes                         | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #13 | FR-2.7: Version history for resume revisions                                    | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #14 | FR-3.1 + FR-3.2 + FR-3.3: Browser extension and Workday form auto-fill         | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #15 | FR-3.4: Generate draft answers to screening questions                           | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |
| #16 | FR-3.5 + FR-3.6: Review and edit auto-filled content before submission          | (none)    | —      | Apr 19, 2026   | Deferred — scope trimmed per Variant C |

### Open at sprint end (in-progress or final-day deliverables)

| #   | Title                                                                                | Assignee  | Points | Status |
| --- | ------------------------------------------------------------------------------------ | --------- | ------ | ------ |
| #24 | [S2-1] Complete CI/CD pipeline: E2E + security + AI review + Vercel deploy           | Lipeipei  | 8      | Open   |
| #25 | [S2-2] Security gates: Gitleaks + security sub-agent + PR template DoD               | Lipeipei  | 5      | Open   |
| #27 | [S2-4] Parallel worktree evidence: document branches run in parallel                 | Both      | 2      | Open   |
| #29 | [S2-6] Writer/Reviewer PRs with C.L.E.A.R. framework + AI disclosure (min 2 PRs)    | Both      | 3      | Open   |
| #30 | [S2-7] README with Mermaid architecture diagram                                      | Both      | 3      | Open   |
| #31 | [S2-8] Technical blog post + screencast (5–10 min)                                   | Both      | 8      | Open   |
| #32 | [S2-9] Sprint 2 planning + retrospectives + reflections + peer evaluations           | Both      | 3      | Open   |
| #63 | [S2-10] Rubric evidence checklist — grader-facing cross-reference                    | Dako      | 2      | Open   |

**Closed story points (Phase 1 core + carryovers):** 59 pts (#18, #22, #26, #28, #48–#54)
**Remaining open story points:** 34 pts (#24, #25, #27, #29–#32, #63)
**Total sprint scope:** 93 pts

**Velocity target:** Close all Phase 1.A–E + both carryovers by Apr 19; ship remaining documentation and infrastructure deliverables in the final 2 days (Apr 20–21).

---

## Definition of Done

A Sprint 2 issue is done when ALL of the following are true:

- [ ] All acceptance criteria in the GitHub issue are checked off
- [ ] Tests written **before** implementation (RED → GREEN visible in git history)
- [ ] `npm run build` passes with zero type errors
- [ ] `npm run lint` passes with zero errors
- [ ] Coverage thresholds met: 70% overall, 90% on `src/profile/`, 80% on `src/ai/`
- [ ] PR opened with C.L.E.A.R. review comment and AI disclosure
- [ ] Security checklist cleared (no secrets committed, Zod validation at boundaries, DB queries scoped to `userId`)
- [ ] Issue closed and linked to merged PR
- [ ] Integration tests pass against real Neon (`DATABASE_URL_TEST`)
- [ ] C.L.E.A.R. self-review completed in PR body
- [ ] Security DoD checklist (from `docs/security.md`) completed in PR description
- [ ] No prompt-injection vector: all user-controlled content in AI prompts wrapped in `<data>` delimiters (e.g. `<job_description>`, `<user_comments>`)

---

## Sprint Ceremonies

| Event                 | Date         | Format                                  |
| --------------------- | ------------ | --------------------------------------- |
| Sprint kickoff        | Apr 12, 2026 | Async (this doc)                        |
| Mid-sprint sync       | Apr 17, 2026 | Async standup — Phase 0/0.5 gate check  |
| Sprint review + retro | Apr 21, 2026 | `docs/phase_1-2/sprint-2-retro.md`      |

---

## Risks and Mitigations

| Risk                                                              | Likelihood | Mitigation                                                                                                                                    |
| ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1 breadth (5 sub-phases in ~4.5 days, solo owner)          | High       | Pre-locked Zod schemas from Phase 0.5 eliminate per-phase design iteration; cut fallbacks defined in `implementation-plan.md` §9 (whole-resume refine, plain-PDF dump) |
| OpenRouter / Claude API rate limits during iterative tailor tests | Medium     | Mock OpenRouter in unit tests; use real API only in E2E + manual UAT; cache structured-output response in fixtures for fast re-runs           |
| Vercel deploy delay blocking README deploy URL                    | Medium     | Kick off Vercel deploy after #24 CI stages merge; README deploy-URL can be filled in as a final commit before submission                       |
| Documentation burden concentrated in last 2 days (Apr 20–21)     | High       | Blog post outline drafted during Phase 1.E; screencast recorded immediately after E2E passes; rubric checklist (#63) filled incrementally       |
| Sprint 1 carryovers (#18, #22) compete with Phase 1 for Lipeipei | Low        | Both closed Apr 4 — confirmed resolved before Phase 1 work began; risk did not materialize                                                    |
