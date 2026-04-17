# Dev patterns per issue — personal reference

**Scope:** Dako's personal working notes. Not rubric-facing, not a spec. Captures the 2026-04-17 discussion on which Claude Code sub-agent pattern fits which Phase 1–2 issue.

## The four patterns

### Pattern A — Sequential command chain
`/plan → /tdd → /build-fix → /code-review → /verify`. You are the orchestrator, running each slash command in sequence, reviewing between steps.

- **Strength:** full visibility, cheap, you stay in the loop.
- **Weakness:** you're the bottleneck; nothing runs in parallel.

### Pattern B — Opus orchestrator with sub-agent delegation
Opus holds the plan, spawns `planner`, `tdd-guide`, `code-reviewer`, `build-error-resolver` as sub-agents, synthesizes results.

- **Strength:** parallel research/review, context protection (sub-agent results compress into summaries), good for broad-scope work.
- **Weakness:** orchestrator loses fidelity on details; expensive; sub-agents can't see each other's work; debugging a bad synthesis is painful.

### Pattern C — Main thread + targeted sub-agent calls
You drive the main thread like Pattern A, but spawn sub-agents *opportunistically* for specific jobs: `Explore` for "where does X live?", `code-reviewer` after a chunky commit, `build-error-resolver` when the build breaks. No orchestrator role — sub-agents are tools, not a hierarchy.

- **Strength:** pragmatic, keeps you in control, uses sub-agents where they actually help.
- **Weakness:** requires you to remember to reach for them.

### Pattern D — Plan-mode front-loaded, sequential execution after
One heavy `/plan` pass up front produces a committed plan doc; implementation phase is then pure Pattern A or C against that plan. The plan *is* the orchestration artifact.

- **Strength:** thinking happens once, execution is mechanical, great for issues where the unknown is "what to do" not "how to coordinate."
- **Weakness:** if the plan is wrong, you discover it mid-execution.

## Recommendation per Phase 1–2 issue

| Issue | Pattern | Why |
|---|---|---|
| **Phase 0 — Cleanup & UAT** | **B (Opus orchestrator)** | Wide blast radius: FK migration, SSRF fix, deps, Zod, UAT. Parallel review by `code-reviewer` + `build-error-resolver` actually pays off. Security-sensitive — orchestrator synthesis catches what sequential flow misses. |
| **Phase 0.5 — Flow & Contract** | **C (main thread + targeted)** | Design iteration is inherently human-driven. Use Stitch MCP directly, spawn `Explore` for "what schemas exist" if needed. No orchestration to do. |
| **Phase 1.A — Profile ingest** | **D → A (plan then sequential)** | Small, well-defined. One `/plan` → straight `/tdd → /build-fix → /verify`. Sub-agents are overkill. |
| **Phase 1.B — Tailor** | **D → A or C** | Core AI integration, moderate risk. Plan-mode up front, sequential after. Spawn `code-reviewer` after the big commit. |
| **Phase 1.C — Refine** | **C (main thread + targeted)** | UX-heavy, iterative. Pattern A's rigid sequence fights the natural "try → adjust → try" loop. Use sub-agents when you hit a specific need. |
| **Phase 1.D — PDF** | **A (sequential)** | Mechanical. One template, one route, one test. |
| **Phase 1.E — E2E + polish** | **B (Opus orchestrator)** | Wide surface: Playwright setup, fixture creation, golden-path spec, empty/loading states across multiple pages. `e2e-runner` + `code-reviewer` + main thread in parallel is the right shape. |

## Meta-heuristic

Don't pick one pattern for the whole phase. Three rules:

1. **Blast radius > 5 files OR cross-cutting (security/migrations/E2E)?** → Pattern B.
2. **Clear scope, moderate size, TDD rubric evidence required?** → Pattern D then A.
3. **UX-iterative or exploratory?** → Pattern C.

## Anti-pattern to avoid

Treating Pattern B as "the serious pattern." Opus orchestrators burn tokens and sometimes produce confident-but-wrong synthesis because the orchestrator never reads the code itself — only sub-agent summaries. For a solo 4.5-day sprint, that failure mode is expensive. Reserve B for issues where parallelism or breadth genuinely helps (Phase 0, Phase 1.E). Everywhere else, driving the main thread is faster and lower-risk.
