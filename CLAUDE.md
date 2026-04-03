# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BypassHire** is an AI-powered job application automation tool for software engineers. It reduces per-application time from 30–60 minutes to under 5 minutes through resume tailoring, interactive editing, and automated form filling.

Full requirements: `docs/PRD_Resume_Refine_AutoFill_Tool.md`

## Development Workflow

Use this command order for every feature:

```
/plan → /tdd → /build-fix → /code-review → /test-coverage → /e2e → /verify
```

- `/plan` — Design before writing code (planner agent, opus model)
- `/tdd` — RED → GREEN → REFACTOR (tests first, always)
- `/build-fix` — Fix build/type errors with minimal diffs
- `/code-review` — Security (CRITICAL), quality (HIGH), performance (MEDIUM)
- `/test-coverage` — Find and generate missing tests
- `/e2e` — Generate Playwright end-to-end tests
- `/verify` — Final check: build + types + lint + tests + git status

## Automated Quality Hooks

Two Claude Code hooks are configured in `.claude/settings.json` and fire automatically during development sessions:

### Hook 1 — PostToolUse: lint-on-edit
**Trigger:** After any `Edit` or `Write` tool call  
**What it does:** Checks if the modified file ends in `.ts` or `.tsx`, then runs ESLint (using the local `eslint.config.js`) and reports violations inline in the transcript.  
**Config:** `.claude/settings.json` → `hooks.PostToolUse` (matcher: `Edit|Write`)

### Hook 2 — Stop: test-runner guard
**Trigger:** Before the Claude Code session ends (Stop event)  
**What it does:** Runs `npm test` (vitest). If tests are failing, returns `continue: false` with a message blocking the session from closing until the agent fixes the failures.  
**Config:** `.claude/settings.json` → `hooks.Stop`

To review or temporarily disable hooks, open `/hooks` in Claude Code.

## Enforced Conventions

- **TDD is mandatory** — tests written BEFORE implementation, visible in git
- **Coverage minimum: 70% overall, 90% on `src/profile/`, 100% on auth/core**
- **Security first** — validate all input with Zod; scope all DB queries to authenticated userId
- **No auto-submit** — Phase 3 auto-fill requires explicit user confirmation before any form submission
- **Branch-per-issue** — one branch per GitHub issue, PR with C.L.E.A.R. review + AI disclosure

## Claude Code Features in Use

- **Hooks:** PostToolUse lint-on-edit + Stop test-runner (see Issue #20)
- **MCP:** GitHub MCP server via `.mcp.json` (see Issue #21)
- **Agents:** `.claude/agents/` — planner, tdd-guide, code-reviewer, build-error-resolver, e2e-runner
- **Skills:** `.claude/skills/` — coding-standards, backend-patterns, e2e-testing, tdd-workflow, verification-loop

---

@docs/architecture.md
@docs/testing-strategy.md
@docs/security.md
