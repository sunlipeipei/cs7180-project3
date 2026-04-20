# What Claude Code's Extensibility Features Actually Changed About My Workflow

I'm a CS7180 student, and my partner and I built BypassHire in two weeks: a Next.js full-stack app that uses the Claude API to tailor resumes to job descriptions and export polished PDFs. The deadline was fixed, the scope was real. This post is about the Claude Code extensibility layer — hooks, skills, MCP servers, subagents, worktrees, and the writer/reviewer pattern — and what it actually changed versus what I expected.

Most tutorials for Claude Code stop at "you can chat with your code." That's table stakes. The extensibility features are where the workflow leverage lives. If you've used Claude Code but never opened `.claude/settings.json`, this is for you.

---

## CLAUDE.md as the Source of Truth

The first decision that paid dividends across the entire two weeks was investing thirty minutes in `CLAUDE.md` before writing a single line of application code.

Our `CLAUDE.md` uses `@imports` to pull in three separate documents:

```
@docs/architecture.md
@docs/testing-strategy.md
@docs/security.md
```

`architecture.md` defines the three-phase structure and the Prisma data model. `security.md` contains our OWASP Top 10 analysis, including prompt injection risk via job description content and SSRF risk in GitHub URL handling. `testing-strategy.md` defines coverage thresholds.

The practical effect: every time I ran `/clear` between workflow phases, the next session started with Claude Code reading all three documents. I never had to re-explain "we use Clerk for auth" or "all DB queries must scope to userId." The CLAUDE.md made those constraints ambient rather than conversational.

Concretely: during Phase 1.b, the code-review agent flagged that `updateResume` was not scoped to `userId` — commit `7b374ba` is the fix. That finding came from the imported `docs/security.md`, not from me remembering to ask. Branch `feat/s1-3-claude-md-imports` shows the CLAUDE.md evolving from a flat file to a modular multi-doc setup — the evolution visible in git history.

---

## Hooks: Automation I Didn't Have to Remember

Four hooks are configured in `.claude/settings.json`. Three are PostToolUse and one is a Stop hook.

**Hook 1 — lint-on-edit.** Fires after any `Edit` or `Write` tool call on a `.ts` or `.tsx` file. It runs `node_modules/.bin/eslint` on the modified file and a second command in the same hook group runs `prettier --check`. The effect: lint and formatting failures never appeared first in CI — they appeared inline during authoring.

**Hook 2 — Stop test-runner guard.** Fires before the session ends. If `npm test` fails, the session cannot close:

```bash
npm test > /tmp/bypasshire-test.txt 2>&1 && echo '{"continue": true}' \
  || echo '{"continue": false, "stopReason": "Tests are failing — fix them before ending the session."}'
```

In practice it caught two situations where I had a GREEN commit locally but had left a failing test in a file I hadn't run individually. The hook forced resolution before the context window closed.

**Hook 3 — commit-signal (tests pass).** Fires after any `Bash` call whose command matches a test runner and exits 0. `.claude/hooks/commit_signal_green.sh` uses ERE word-boundary matching against `vitest`, `npm test`, `playwright test`, `bun test`, and others. Exclusions prevent false positives on `npm install` or `grep pytest`. When it fires, it injects `additionalContext` noting that tests passed and this is a natural commit point. It never runs `git commit`. The `.claude/hooks/README.md` states the design principle: "Signal, don't act." Hooks emit JSON on stdout; Claude reads it and decides.

**Hook 4 — commit-signal (task completed).** Fires after any `TodoWrite` call where at least one todo transitions to `completed`. It diffs against `.claude/state/last-todos.json` and emits a `systemMessage`. Snapshot-based, so the same completion doesn't re-fire.

The hooks work as a group: lint-on-edit keeps files clean, the Stop guard keeps the test suite honest, and the two commit-signal hooks surface natural checkpoint moments without taking over.

---

## Skills: /fix-issue v1 to v2

Skills are markdown files in `.claude/skills/` that become callable as slash commands. We have nine skills: `architecture-decision-records`, `backend-patterns`, `coding-standards`, `e2e-testing`, `fix-issue`, `playwright-cli`, `react-components`, `tdd-workflow`, and `verification-loop`.

The one that iterated most visibly was `/fix-issue`. Version 1 (branch `feat/add-fix-issue-skill`, commit `616665d`) defined the basic loop: read the GitHub issue, create a branch, run TDD, open a PR. Version 2 (commit `2edc9d5`) added four changes:

- **Branch verification:** The skill now runs `git branch --show-current` after checkout and stops if the name doesn't match. This caught one session where the checkout had silently failed.
- **Prettier before commit:** Each TDD phase now runs `npx prettier --write .` before staging. Added after CI failed on formatting checks that had passed locally.
- **CI env var checklist:** When a feature introduces new env vars, the skill produces a four-item checklist: `.env.example`, GitHub Actions secrets, Vercel env vars, and `ci.yml`. This formalized something we were doing inconsistently.
- **Monitor CI after PR:** The skill instructs the agent to watch CI after opening the PR and fix failures on the same branch before considering the issue done.

The v1→v2 delta was driven by two CI failures during the Clerk auth feature (issue #18) — one missing Clerk env var in the E2E job, one Prettier formatting issue. The iteration was a response to real friction, not upfront over-engineering.

`/tdd` runs the `tdd-guide` subagent (Sonnet) which refuses to generate implementation code until a RED test exists. `/verify` runs `npm run lint`, `npm run format:check`, `npx tsc --noEmit`, `npm test`, and `npm run build` — the exit gate before any PR.

---

## MCP: Four Servers, One Config

MCP servers extend what Claude Code can access without writing bespoke tool wrappers. Ours were declared in a `.mcp.json` file at the repo root [VERIFY: `.mcp.json` exists at repo root — it was not found during this session's file reads; config may live in a parent directory or user-level config].

The four configured servers were:

**GitHub MCP** (`ghcr.io/github/github-mcp-server`, Docker). Authenticated via `GITHUB_PERSONAL_ACCESS_TOKEN`. Used during `/fix-issue` to fetch issue titles, acceptance criteria, and labels directly from GitHub. The skill's Step 1 calls `mcp__github__issue_read` to extract requirements before planning starts.

**Vercel MCP** (`vercel-mcp-server` via `npx`). Used to check deployment status and inspect environment variables on preview deploys — useful when a CI-green build became a broken preview due to a missing variable on the Vercel side.

**Google Stitch MCP** (HTTP transport to `https://stitch.googleapis.com/mcp`, `GOOG_API_KEY` header). Used for UI mockup generation during the Phase 0.5 flow-and-contract phase, where we generated screen designs before any backend work started.

**Playwright MCP** (`@playwright/mcp` via `npx`, no credentials). Gave Claude Code browser automation during E2E test development. Instead of writing Playwright selectors blind, the agent could navigate the running app, inspect the DOM, and take screenshots during test authoring.

All four servers are defined once in `.mcp.json` and available to every subagent automatically — no per-session setup.

---

## Subagents: The Writer/Reviewer Loop

The `.claude/agents/` directory has six definitions: `architect.md`, `build-error-resolver.md`, `code-reviewer.md`, `e2e-runner.md`, `planner.md`, and `tdd-guide.md`. Each has a narrow mandate, model selection, and tool allowlist. The `planner` runs on Opus with read-only tools and never writes files. The `tdd-guide` runs on Sonnet with write access and enforces the RED phase before implementation. The `code-reviewer` runs on Sonnet and applies a CRITICAL → HIGH → MEDIUM → LOW checklist.

The writer/reviewer pattern meant the agent that wrote code was never the one that reviewed it. This separation caught the Phase 1.b `userId` scoping omission — a security issue that a passing unit test wouldn't surface because unit tests don't validate authorization boundaries.

C.L.E.A.R. (Context, Limitations, Errors, Alternatives, Risks) was applied in PR review bodies. The `/fix-issue` skill's Step 10 requires a C.L.E.A.R. section alongside the summary and AI disclosure. The plan produced by `/plan` was saved to `docs/phase_1-2/implementation-plan.md` so it survived `/clear` and could be referenced mid-session.

---

## Worktrees: Two Features in Parallel

Git worktrees let you check out multiple branches into separate directories simultaneously, so two features can compile and run independently without branch-switching overhead.

The branch list shows two worktree branches: `worktree-e2e` and `worktree-night_wildness`. A third, `claude/determined-gagarin-44f035`, shows a Claude Code session running autonomously on a separate branch. The underlying mechanic is:

```bash
git worktree add .claude/worktrees/e2e worktree-e2e
```

The `worktree-e2e` branch let E2E test development proceed independently from main feature work. While Phase 1.d (PDF export) was being built, E2E scaffolding for earlier phases could be written in the worktree without merge conflicts. `vitest.config.ts` was updated to exclude `.claude/worktrees/**` from unit test discovery so worktree test files didn't pollute the main run.

Worktrees were most useful for the E2E track because E2E tests have different lifecycle assumptions — they need a running server, they're slower, and they fail differently. The main branch could iterate quickly on unit-tested backend code without waiting for E2E stability.

---

## The /plan → /tdd → /code-review → /verify Chain

The CLAUDE.md specifies a workflow order:

```
[/architect →] /plan → /tdd → /build-fix → /code-review → /test-coverage → /e2e → /verify
```

Each command invokes a specific subagent with a narrow responsibility. `/plan` calls the Opus-model planner to produce a plan with architecture, file paths, and risk assessment — then stops and waits for user confirmation. `/tdd` calls the TDD guide to produce failing tests first, then minimum implementation. `/code-review` applies the CRITICAL/HIGH/MEDIUM/LOW checklist. `/verify` runs the five-step quality gate.

The chain enforces separation of concerns: the planner doesn't write code, the TDD agent doesn't review code, the reviewer doesn't plan. Each agent gets a clean context window focused on its job.

The commit history shows this in practice. Each Phase 1 sub-phase has visible RED→GREEN pairs: `test(phase-1.a): RED` (commit `93a61c2`) followed by `feat(phase-1.a): GREEN` (commit `69443b0`). The same pattern repeats for Phase 1.b (`8e4f9cb` → `cd4a5fc`) and Phase 1.c (`92c3f7f` → `3016744`). Each RED commit ran `npm test` to confirm failures; each GREEN commit ran `npm test` to confirm all passing.

---

## What I'd Do Differently

**Hook misfires on partial edits.** The lint-on-edit hook occasionally ran ESLint on a `.ts` file mid-edit — when the `Edit` tool had applied a partial change that was temporarily syntactically invalid. ESLint reported errors on a file that was fine after the edit completed. A debounce or run-only-on-Write-not-Edit fix would help.

**Subagent context fragmentation.** When `/plan` produced an implementation plan and I then invoked `/tdd`, the TDD agent sometimes missed context from the plan — particularly around which env vars were needed. Subagents have separate context windows, so the planner's output isn't visible to the TDD agent unless written to a file. Saving the plan to `docs/phase_1-2/implementation-plan.md` worked but added a manual step.

**Commit-signal timing.** The commit-signal hooks fire after the Bash tool call exits. If I ran `npm test` to confirm GREEN and immediately ran another command, the context injection from the hook sometimes arrived mid-second-command. This is inherent to the signal-only design — hooks can't synchronize with Claude's response generation.

---

## Takeaways

- **CLAUDE.md with `@imports` is the highest-leverage setup investment.** Every session inherits your security rules, architecture decisions, and coverage thresholds automatically. Thirty minutes of upfront work pays off across every session for the rest of the project.

- **Skills should iterate from real failures, not upfront design.** `/fix-issue` v1 was functional. The v2 additions (branch verification, CI env var checklist, Prettier enforcement) came directly from two CI failures during the Clerk auth feature. Design skills to be minimal and editable.

- **The writer/reviewer separation catches issues that tests don't.** Unit tests verify behavior; the code reviewer checks trust boundaries and authorization logic — things hard to unit test. A separate subagent for review produces better signal because the reviewer has no attachment to the implementation choices.
