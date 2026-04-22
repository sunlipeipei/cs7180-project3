
# Individual Reflection — Qi Wei
**CS7180 Project 3 — BypassHire**
**2026-04-20**

---

## What I Was Trying to Build — and Why the Tooling Mattered

BypassHire's Phase 1 was mine to own solo: seven GitHub issues, five sub-phases (1.A through 1.E), a real Neon database, and a two-week hard deadline. The scope included an AI ingestion pipeline, a tailor endpoint, an inline refine editor, PDF export, and a Playwright E2E suite — a full product slice, not a homework exercise. Without structured tooling I would have cut corners on tests just to ship. What made Claude Code worth the learning curve was not the chat interface but the extensibility layer: hooks, subagents, and skills that encode project conventions so I do not have to re-explain them every session.

## One Feature That Paid Off: The Stop Hook as a Regression Wall

The most concrete payoff was the Stop hook in `.claude/settings.json`. Before any session can close, it runs `npm test` and blocks exit if tests fail. What I can say is that this hook changed my mental model: instead of trusting myself to remember, the exit gate enforced it structurally. The commit history shows the rhythm — `fix(phase-1.a): GREEN — MasterProfileSchema accepts null from LLM` (commit `2908fca`) followed immediately by `test(phase-1.a): cover null-optional LLM payloads` (`232e5c0`) — a tight RED/GREEN pair that stayed tight because the Stop hook kept me honest. A second PostToolUse hook ran ESLint on every `.ts`/`.tsx` edit, surfacing formatting violations inline instead of letting them pile up before a commit.

## One Feature That Surprised Me: Subagents Changing How I Write

I expected subagents to accelerate code generation. I did not expect them to change how I approach design. The `/plan` command invokes the planner agent (Opus-model, `planner.md`), which produced a structured artifact — implementation plan, decision log, phase map — before any code existed. The seven locked decisions in §1.6 of `docs/phase_1-2/implementation-plan.md` (L1 through L7) exist because the planner demanded written rationale for each one. Without that forcing function, the Phase 0.5 flow-and-contract phase would never have been inserted; I would have discovered missing UX validation halfway through Phase 1.B. The `/plan → /tdd → /code-review → /verify` chain in CLAUDE.md reads like overhead until you watch the code-reviewer subagent catch a security gap — `fix(phase-1.b): scope updateResume to userId` (commit `7b374ba`) — that I had missed on my own pass.

## One Limitation I Hit

Subagent context does not persist across sessions. The planner agent starts fresh each time, which means the plan document (`implementation-plan.md`) had to carry all the durable context — the subagent could not. In practice this meant I spent the first few minutes of every session re-orienting the agent to decisions already made.  The CLAUDE.md `@import` pattern partially mitigated this, but the gap between "agent remembers" and "agent re-reads a file" is real.

## What I Am Taking Forward

The lesson is that Claude Code's value scales with how much project knowledge you encode upfront. Hooks, skills, and agent prompts are not configuration overhead — they are amortized investment. Every hour spent writing `planner.md` or configuring the Stop hook paid back across every subsequent session. The habit I am keeping: before writing any feature code, write the constraints first — in a file the tooling will actually read.
