# Sprint 2 Retrospective

**Sprint:** Apr 12–21, 2026
**Due:** Apr 21, 2026
**Participants:** Lipeipei Sun (sunlipeipei), Dako (iDako7 / dako7777777)

---

## Sprint Goal Assessment

**Goal:** Ship Phase 1 tailoring engine end-to-end (Phase 0 cleanup → Phase 0.5 flow & contract → Phase 1.A–E), close Sprint 1 carryovers (#18, #22), advance Claude Code mastery evidence (skills v2, writer/reviewer PRs, worktree evidence), complete security gates, and deliver all documentation deliverables by the Apr 21 submission deadline.

| Outcome                                            | Status      | Closed / Merged                         |
| -------------------------------------------------- | ----------- | --------------------------------------- |
| Phase 0 cleanup & UAT (#48)                        | Done        | Apr 17 — PR #55 (`2612421`)             |
| Phase 0.5 flow & contract (#49)                    | Done        | Apr 18 — PR #57 (`945633f`)             |
| Phase 1.A profile ingest (#50)                     | Done        | Apr 18 — PR #59 (`551855d`)             |
| Phase 1.B tailor engine (#51)                      | Done        | Apr 18 — PR #60 (`553d83c`)             |
| Phase 1.C refine (#52)                             | Done        | Apr 18 — PR #61 (`07d90b0`)             |
| Phase 1.D PDF export (#53)                         | Done        | Apr 18 — PR #62 (`0f7194c`)             |
| Phase 1.E E2E + polish (#54)                       | Done        | Apr 19 — PR #64 (`e2b2158`)             |
| Clerk auth carryover (#18)                         | Done        | Apr 4 — PR #40 (Sprint 1 carryover)     |
| CI/CD basic (#22)                                  | Done        | Apr 4 — PR #38 (Sprint 1 carryover)     |
| Playwright E2E critical journey (#26)              | Done        | Apr 19 — closed via PR #64              |
| Custom skills v1→v2 (#28)                          | Done        | Apr 20                                  |
| Complete CI/CD pipeline (#24)                      | Open        | In-flight at retro time                 |
| Security gates (#25)                               | Open        | In-flight at retro time                 |
| Parallel worktree evidence (#27)                   | Open        | In-flight (documentation wave Apr 20–21)|
| Writer/Reviewer PRs + C.L.E.A.R. (#29)            | Open        | In-flight at retro time                 |
| README (#30)                                       | Open        | In-flight at retro time                 |
| Blog post + screencast (#31)                       | Open        | In-flight at retro time                 |
| Sprint 2 docs (#32)                                | Open        | This document is one deliverable        |
| Rubric checklist (#63)                             | Open        | In-flight at retro time                 |

---

## What Went Well

- **Phase 0 UAT gate caught the userId FK bug that CI missed.** The P0 blocker — Clerk ID used directly as a DB foreign key (`app/api/job-descriptions/route.ts:9`) — survived 119 passing unit tests because Prisma was fully mocked in CI. The real-Neon integration test tier activated in Phase 0 (decision L3) caught the constraint violation on the first real DB write. Without the UAT gate, this bug would have reached Phase 1 feature PRs. Fix: collapse `User.id` to equal `clerkId` via a single migration — commit `d56ffc8`.

- **Phase 0.5 front-loaded UX and schema risk.** Locking `src/ai/schemas.ts` completely before any Phase 1 work meant every sub-phase (1.A through 1.E) was pure backend + frontend wire-up with no design iteration. Each sub-phase shipped in approximately half a day, consistent with the implementation plan estimate. All five Phase 1 issues closed on Apr 18 — one day ahead of the Apr 19 feature freeze.

- **TDD cadence produced three verifiable RED→GREEN pairs for the rubric.** Phase 1.A: `93a61c2` (RED — `extractText` reads PDF buffer) → `69443b0` (GREEN). Also `a463638` (RED — null-optional profile fields) → `2908fca` (GREEN). Phase 1.B: `8e4f9cb` (RED — `tailorResume` spec) → `cd4a5fc` (GREEN). Phase 1.C: `92c3f7f` (RED — `refineResumeSection` section scope) → `3016744` (GREEN). All six commits are in main's git history and confirm the discipline was followed, not retrofitted.

- **Parallel worktree execution worked in practice.** Branch `feature/dev-auth-bypass` (PR #56, merged `cf3df86`) and branch `phase-0.5/flow-and-contract` (PR #57, merged `945633f`) both merged on Apr 18 within a 96-minute window (07:31 and 07:57 UTC respectively), demonstrating real parallel development without merge conflicts.

- **Commit-signal hooks nudged checkpointing without auto-committing.** The hooks fired after every green test run and completed todo, keeping commit history clean and granular across the Phase 0/0.5/1 sequence without interrupting flow.

---

## What to Improve

- **Documentation burden concentrated in the final 48 hours (Apr 20–21).** Eight open issues at retro time (#24, #25, #27, #29, #30, #31, #32, #63) are documentation, CI/CD, or mastery-evidence deliverables. The blog post outline, README draft, and worktree evidence file should have been started mid-sprint (around Apr 17–18, when Phase 0 was done) rather than deferred to the final two days before submission.

- **Solo Phase 1 ownership left a parallel-track gap.** Dako owned Phase 0 through Phase 1.E solo. Lipeipei's parallel track (#26 E2E, #28 skills v2) was meaningful but was blocked by Phase 0.5 API contracts not yet landing until Apr 18, which compressed the available runway on those issues. Pulling #26 and #28 earlier — or starting them against stubbed contracts — would have distributed work more evenly across the sprint.

- **Sprint 1 carryovers (#18, #22) consumed the first two days.** Both closed Apr 4 — the same day Sprint 2 started. The Sprint 1 retrospective flagged this risk and called it out as an action item, but the underlying estimation failure (underestimating Clerk middleware complexity and CI branch protection setup) was not post-mortemed into the Sprint 2 plan with a buffer.

- **Story points on documentation issues were underestimated.** The 34 remaining open points at feature freeze (#24, #25, #27, #29–#32, #63) represent a substantial final-day delivery risk. Bundling all documentation and infrastructure work for Apr 20–21 execution was the plan's stated risk, and it materialized. A mid-sprint documentation checkpoint (e.g., Apr 17 sync) should have produced at least one artifact per partner.

---

## Action Items

| Action                                                                              | Owner     | Due         |
| ----------------------------------------------------------------------------------- | --------- | ----------- |
| Land #24 CI/CD pipeline (E2E stage, security scan, AI review, Vercel prod deploy)  | Lipeipei  | Apr 21, 2026 |
| Land #25 Gitleaks pre-commit hook, security sub-agent, PR template DoD             | Lipeipei  | Apr 21, 2026 |
| Finalize README architecture diagram (#30), blog post + screencast (#31)            | Both      | Apr 21, 2026 |
| Finalize worktree evidence doc (#27) and C.L.E.A.R. PR evidence (#29)              | Both      | Apr 21, 2026 |
| Run rubric checklist #63 as final grader-facing cross-reference before submission   | Dako      | Apr 21, 2026 |
| For future sprints: schedule at least one documentation artifact per partner at mid-sprint rather than end-sprint | Both | Future |
