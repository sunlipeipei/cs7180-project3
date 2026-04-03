# Sprint 1 Planning

**Sprint dates:** Apr 2–11, 2026  
**Sprint goal:** Establish the full-stack foundation (Next.js + PostgreSQL + Clerk auth) and all Claude Code mastery infrastructure (hooks, MCP, CI/CD baseline), leaving the team unblocked to build Phase 1 features in Sprint 2.

---

## Team

| Member | GitHub | Role |
|---|---|---|
| Lipeipei Sun | sunlipeipei | Full-stack + Claude Code infrastructure |
| Partner B | iDako7 | Full-stack + Master Profile module |

---

## Issue List with Story Points

| # | Title | Assignee | Points | Status |
|---|---|---|---|---|
| #17 | [S1-1] Migrate to Next.js App Router + PostgreSQL + Prisma | Lipeipei | 8 | Done |
| #18 | [S1-2] Authentication with Clerk (job seeker role) | Lipeipei | 5 | In Progress |
| #19 | [S1-3] CLAUDE.md refactor + OWASP security docs | Lipeipei | 2 | Done |
| #20 | [S1-4] Configure 2+ hooks in `.claude/settings.json` | Lipeipei | 3 | Done |
| #21 | [S1-5] Integrate GitHub MCP server + `.mcp.json` | Lipeipei | 3 | Done |
| #22 | [S1-6] Basic CI/CD: lint + typecheck + unit tests | Lipeipei | 5 | Open |
| #23 | [S1-7] Sprint 1 planning doc + async standups | Both | 2 | In Progress |
| #5  | FR-1.1: Accept job description as input | Partner B | 5 | Open |
| #6  | FR-1.2: Accept user resume as style template (.docx) | Partner B | 5 | Open |
| #2  | Master Profile Management (FR-1.6) | Partner B | 8 | Done |

**Total points:** 46  
**Velocity target:** Complete all infrastructure issues (#17–#23) and make meaningful progress on #5 and #6.

---

## Definition of Done

A Sprint 1 issue is done when ALL of the following are true:

- [ ] All acceptance criteria in the GitHub issue are checked off
- [ ] Tests written **before** implementation (RED → GREEN visible in git history)
- [ ] `npm run build` passes with zero type errors
- [ ] `npm run lint` passes with zero errors
- [ ] Coverage thresholds met: 70% overall, 90% on `src/profile/`
- [ ] PR opened with C.L.E.A.R. review comment and AI disclosure
- [ ] Security checklist cleared (no secrets committed, Zod validation at boundaries, DB queries scoped to `userId`)
- [ ] Issue closed and linked to merged PR

---

## Sprint Ceremonies

| Event | Date | Format |
|---|---|---|
| Sprint kickoff | Apr 2, 2026 | Async (this doc) |
| Mid-sprint sync | Apr 6, 2026 | Async standup check-in |
| Sprint review + retro | Apr 11–12, 2026 | `docs/sprints/sprint-1-retro.md` |

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Clerk integration delays auth (#18) | Medium | Use Clerk Next.js SDK docs; unblock with mock auth for dev |
| CI/CD setup (#22) takes longer than estimated | Low | Reuse existing `vitest` config; limit to 3 stages in Sprint 1 |
| Coverage threshold not met on first pass | Medium | Run `npm run test:coverage` early; add missing tests before PR |
