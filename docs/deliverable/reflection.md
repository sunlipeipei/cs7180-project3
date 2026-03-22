# Reflection: Claude Code Development Workflow

**CS7180 Project 3 — BypassHire**
**March 21, 2026**

---

## How Does the Explore-Plan-Implement-Commit Workflow Compare to My Previous Approach?

Before using Claude Code's structured workflow, my development process was largely ad-hoc: read the requirements, start coding the parts I understood, and figure out edge cases as I went. This works for small scripts but breaks down for anything with interconnected components. With BypassHire's Master Profile Management module, for instance, the data model feeds into three downstream phases (resume tailoring, interactive editing, auto-fill). Getting the schema wrong early would cascade into rework across the entire system.

The **Explore** phase was the most impactful change to my habits. Using `Glob`, `Grep`, and `Read` to systematically survey the codebase before writing any code forced me to understand the full picture. When I explored the PRD for FR-1.6, I discovered that Phase 3's Workday auto-fill (FR-3.2) requires structured address fields with city and country as mandatory. Without that exploration, I likely would have modeled the address as a flat string and had to refactor it later. The structured exploration turned a potential future refactor into an upfront design decision.

The **Plan** phase, using the `/plan` command with the Opus-model planner agent, produced a detailed implementation plan with architecture, data model, merge strategies, and a 4-cycle TDD breakdown. This changed my relationship with planning from "I have a rough idea in my head" to "I have a documented, reviewed plan that I and the AI agreed on." When I was deep in implementing the merge logic for Cycle 4, I could refer back to the plan's identity-key table instead of making ad-hoc decisions about how to deduplicate work experience entries. The plan served as a contract between the planning phase and the implementation phase, preventing scope drift.

The **Implement** phase, structured around TDD cycles, is discussed in the next section. The key insight is that TDD plus Claude Code is a multiplicative combination — Claude Code writes the test scaffolding much faster than I could by hand, but the TDD discipline ensures I review and validate every test before moving to implementation.

The **Commit** phase was more intentional than my usual "commit when it feels done" approach. Because each TDD cycle had a natural RED→GREEN→REFACTOR rhythm, commit boundaries aligned with meaningful milestones rather than arbitrary save points. The co-authorship tags (`Co-Authored-By: Claude Opus 4.6`) also made the collaboration transparent in the git history, which matters for academic integrity and team awareness.

**Bottom line:** The workflow trades spontaneity for predictability. Each phase has a clear entry condition and exit condition, which reduces the "what do I do next?" decision fatigue that slows down complex projects. The overhead of running `/plan` before coding is small compared to the time saved by not reworking a poorly-thought-out design.

---

## What Context Management Strategies Worked Best?

Claude Code's context window is large but not infinite. Over the course of implementing the Master Profile module (49 tests, 6 source files, multiple review iterations), I learned which strategies kept sessions productive:

**CLAUDE.md as persistent memory.** The most effective strategy was front-loading project context into `CLAUDE.md`. Because Claude Code reads this file automatically at session start, I never had to re-explain the tech stack, the 3-phase architecture, or the TDD requirement. The `@import` reference to the PRD meant full requirements were available without pasting them into the chat. This is the single biggest force multiplier — it turns every new session into a continuation rather than a cold start.

**The .claude/ framework as reusable context.** The 17 markdown files in `.claude/` (commands, agents, skills) encode domain-specific knowledge that persists across sessions. The `tdd-workflow` skill contains mocking patterns and coverage thresholds; the `backend-patterns` skill has validation and error-handling conventions. Rather than explaining "use Zod for validation" each time, the skill documents make this knowledge ambient. The agents add behavioral enforcement — the tdd-guide agent refuses to write implementation before tests exist.

**/clear between workflow phases.** When I finished the project setup (Part 1) and moved to feature implementation (Part 2), the setup context — `.gitignore` configuration, ECC reference cleanup, PR #1 review comments — was no longer relevant. Running `/clear` reset the context so the implementation session focused entirely on the Master Profile module. Without this, earlier context would have consumed token budget and potentially confused Claude Code's responses.

**/compact during long TDD sessions.** Each TDD cycle generates substantial output: test failures (RED), test passes (GREEN), coverage reports. By mid-session, the accumulated output from Cycles 1-2 was consuming context but no longer informing Cycles 3-4. Running `/compact` compressed prior exchanges into summaries, freeing context for the merge logic implementation (the most complex part of the module).

**--continue for cross-session continuity.** After opening PR #3 and receiving review feedback, I used `--continue` to resume the session with full prior context. This meant Claude Code understood exactly what code it had written, what decisions it had made, and could address review comments (post-merge validation, deep-merge for nested objects) without me re-explaining the architecture.

**Plan documents as durable references.** The plan at `docs/plan-master-profile.md` outlasted any single session. When I resumed work after a break, the plan provided the complete specification — data model, merge strategies, acceptance criteria — independent of Claude Code's context. This is complementary to `/compact` and `/clear`: volatile context gets compressed or cleared, but the plan persists on disk.

The strategy that worked least well was trying to keep everything in a single long session. The TDD cycles generate too much intermediate output (test failures, compilation errors, coverage reports) that doesn't stay relevant. The combination of **CLAUDE.md for persistent context + /clear between phases + /compact within phases + plan documents for specifications** gave the best results.

---

## Annotated Session Log Highlights

The full annotated session log is in `docs/session-log.md`. Three moments stand out:

**1. Exploration prevented a design mistake.** During the Explore phase, reading the PRD revealed that FR-3.2 (Workday auto-fill) requires city and country in address fields. Without this, I would have modeled the address as a simple string. The structured exploration turned a future refactor into an upfront decision — 5 minutes of reading saved hours of rework. (See Session Log §2.1)

**2. TDD caught a merge safety gap.** The code review after TDD implementation identified that `mergeProfile()` could silently produce invalid profiles — a valid base merged with a valid partial could result in a missing required field. Post-merge Zod validation, added in response to review, catches this class of bugs at merge time rather than letting them propagate to downstream consumers. This is the value of running `/code-review` after `/tdd` — semantic issues that individual unit tests don't cover. (See Session Log §2.4)

**3. Context management made sessions focused.** The transition from setup (Part 1, commits `134cd6e`–`4391732`) to implementation (Part 2, commits `8254659`–`20aa621`) was clean because `/clear` reset the context. The implementation session started with Claude Code reading CLAUDE.md and the plan document — not sifting through setup-phase discussion about `.gitignore` patterns and ECC references. Each phase operated with the minimum context it needed. (See Session Log §2.5)
