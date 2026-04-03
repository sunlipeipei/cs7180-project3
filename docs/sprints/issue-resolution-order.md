# Issue Resolution Order

## Dependency Chain (strict sequence)

```
S1-1 (Next.js + DB)
  └── S1-2 (Auth)
        ├── #5 FR-1.1 (Job Description Intake)
        └── #6 FR-1.2 (Resume Upload)
              └── #7 FR-1.3 (GitHub Context Extraction)  ← also needs S1-5 MCP
                    └── #8 FR-1.4+1.5 (Resume Tailoring Engine)
                          └── #9 FR-2.1 (Editing UI)
                                └── #10 FR-2.2+2.3 (Inline Comments + AI Revision)
                                      └── #11 FR-2.4 (Multi-round Editing)
                                            └── #12 FR-2.5+2.6 (Diff View + Accept/Reject)
                                                  └── #13 FR-2.7 (Version History)
```

---

## Sprint 1: Apr 2–11

| Days | Track A | Track B |
|------|---------|---------|
| 1–2 | **#17 S1-1** — Migrate to Next.js + PostgreSQL + Prisma | **#19 S1-3** — CLAUDE.md @imports + OWASP docs |
| 2–3 | **#18 S1-2** — Authentication with Clerk | **#20 S1-4** — Hooks + **#21 S1-5** — GitHub MCP |
| 3–4 | **#22 S1-6** — Basic CI/CD (lint + typecheck + tests) | **#23 S1-7** — Sprint 1 planning doc + standups |
| 5–7 | **#5 FR-1.1** — Job Description Intake UI (TDD) | **#6 FR-1.2** — Resume Template Upload (TDD) |

---

## Sprint 2: Apr 12–21

| Days | Track A (Worktree A) | Track B (Worktree B) |
|------|----------------------|----------------------|
| 8–11 | **#7 FR-1.3** — GitHub Context Extraction (TDD) | **#8 FR-1.4+1.5** — Resume Tailoring Engine skeleton (TDD) |
| 12–14 | **#8 FR-1.4+1.5** — Wire context in, finish engine | **#24 S2-1** — Full CI/CD + **#25 S2-2** — Security gates |
| 14–16 | **#9 FR-2.1** — Editing UI | **#26 S2-3** — Playwright E2E stubs → implementation |
| 16–18 | **#10 FR-2.2+2.3** — Inline comments + AI revision | **#27 S2-4** — Worktree evidence + merge PRs |
| 18–19 | **#11 FR-2.4** → **#12 FR-2.5+2.6** → **#13 FR-2.7** (stretch) | **#28 S2-5** — Skills v1→v2 + **#29 S2-6** — C.L.E.A.R. PRs |
| 19–21 | **#30 S2-7** — README + Mermaid diagram | **#31 S2-8** — Blog post + screencast |
| 21 | **#32 S2-9** — Retros + reflections + peer evals | — |

> Phase 3 issues (#14 FR-3.1, #15 FR-3.4, #16 FR-3.5+3.6) are stretch goals — only start after FR-2.3 is merged.

---

## Key Rules

1. **#17 S1-1 is day 1** — nothing else can start without Next.js + DB.
2. **#21 S1-5 (MCP) must land before #7 FR-1.3** — the GitHub MCP powers context extraction.
3. **#7 FR-1.3 and #8 FR-1.4 are the worktree moment** — run in parallel branches to satisfy S2-4, and merge both via C.L.E.A.R. PRs to satisfy S2-6.
4. **#26 S2-3 E2E stubs go in early** (day 14) — write the test before the UI pages exist (TDD), then go green after #9 FR-2.1 is done.
5. **#31 S2-8 (screencast) is last** — record after the app is deployed and stable on Vercel.
