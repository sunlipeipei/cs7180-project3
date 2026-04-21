# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BypassHire** is an AI-powered job application automation tool for software engineers. It reduces per-application time from 30–60 minutes to under 5 minutes through resume tailoring, interactive editing, and automated form filling.

Full requirements: `docs/PRD_Resume_Refine_AutoFill_Tool.md`

## Development Workflow

Use this command order for every feature:

```
[/architect →] /plan → /tdd → /build-fix → /code-review → /test-coverage → /e2e → /verify
```

- `/architect` — *Optional, for system-shape decisions only.* System-level design and ADRs (architect agent, opus model)
- `/plan` — Design before writing code (planner agent, opus model)
- `/tdd` — RED → GREEN → REFACTOR (tests first, always)
- `/build-fix` — Fix build/type errors with minimal diffs
- `/code-review` — Security (CRITICAL), quality (HIGH), performance (MEDIUM)
- `/test-coverage` — Find and generate missing tests
- `/e2e` — Generate Playwright end-to-end tests
- `/verify` — Final check: build + types + lint + tests + git status

## Automated Quality Hooks

Four Claude Code hooks are configured in `.claude/settings.json` and fire automatically during development sessions:

### Hook 1 — PostToolUse: lint-on-edit

**Trigger:** After any `Edit` or `Write` tool call  
**What it does:** Checks if the modified file ends in `.ts` or `.tsx`, then runs ESLint (using the local `eslint.config.js`) and reports violations inline in the transcript.  
**Config:** `.claude/settings.json` → `hooks.PostToolUse` (matcher: `Edit|Write`)

### Hook 2 — Stop: test-runner guard

**Trigger:** Before the Claude Code session ends (Stop event)  
**What it does:** Runs `npm test` (vitest). If tests are failing, returns `continue: false` with a message blocking the session from closing until the agent fixes the failures.  
**Config:** `.claude/settings.json` → `hooks.Stop`

### Hook 3 — PostToolUse: commit-signal (tests pass)

**Trigger:** After any `Bash` tool call whose command matches a test runner (`vitest`, `npx vitest`, `npm test`, `playwright test`, `bun test`, `pytest`, `promptfoo eval`) AND exits 0.  
**What it does:** Injects `additionalContext` nudging Claude to ask whether to commit a checkpoint. **It never runs `git commit` itself** — it only signals.  
**Script:** `.claude/hooks/commit_signal_green.sh`  
**Config:** `.claude/settings.json` → `hooks.PostToolUse` (matcher: `Bash`)

### Hook 4 — PostToolUse: commit-signal (task completed)

**Trigger:** After any `TodoWrite` tool call where at least one todo transitions to `completed` (diffed against `.claude/state/last-todos.json`).  
**What it does:** Emits a `systemMessage` nudging Claude to ask whether to commit the completed slice. Snapshot-based, so the same completion does not re-fire.  
**Script:** `.claude/hooks/commit_signal_task.sh`  
**Config:** `.claude/settings.json` → `hooks.PostToolUse` (matcher: `TodoWrite`)

**Kill switch for Hooks 3 & 4:** set `BYPASSHIRE_DISABLE_COMMIT_HOOKS=1` in the environment.

**Testing Hooks 3 & 4:** `bash .claude/hooks/test.sh` runs 25 stdin-fixture tests. Design notes live in `.claude/hooks/README.md`.

To review or temporarily disable hooks, open `/hooks` in Claude Code.

## MCP Servers

Two MCP servers are configured in `.mcp.json` at the repo root:

### GitHub MCP (`github`)

- **Image:** `ghcr.io/github/github-mcp-server` (official Docker image)
- **Auth:** `GITHUB_PERSONAL_ACCESS_TOKEN` — PAT with `repo` read scope
- **Use:** Fetch README, repo metadata, file contents, and language stats during FR-1.3 context extraction

### Vercel MCP (`vercel`)

- **Package:** `vercel-mcp-server` (via `npx`)
- **Auth:** `VERCEL_API_TOKEN` — API token from vercel.com/account/tokens
- **Use:** Check deployment status, inspect environment variables, and tail logs during development

### Google Stitch MCP (`stitch`)

- **Transport:** HTTP — `https://stitch.googleapis.com/mcp`
- **Auth:** `GOOG_API_KEY` — Google API key passed via `X-Goog-Api-Key` header
- **Use:** Google Stitch services integration (HTTP-based MCP, no Docker/npx required)

### Playwright MCP (`playwright`)

- **Package:** `@playwright/mcp` (official Microsoft package, via npx)
- **Auth:** None required
- **Use:** Browser automation for E2E testing — navigate pages, click, fill forms, take screenshots, and inspect the DOM directly from Claude Code sessions

**Setup:** Add all tokens to your local `.env` (see `.env.example`), then run `/mcp` in Claude Code to enable the servers. Playwright MCP requires no credentials — just enable it.

## Enforced Conventions

- **TDD is mandatory** — tests written BEFORE implementation, visible in git
- **Coverage minimum: 70% overall, 90% on `src/profile/`, 100% on auth/core**
- **Security first** — validate all input with Zod; scope all DB queries to authenticated userId
- **No auto-submit** — Phase 3 auto-fill requires explicit user confirmation before any form submission
- **Branch-per-issue** — one branch per GitHub issue, PR with C.L.E.A.R. review + AI disclosure

## Claude Code Features in Use

- **Hooks:** PostToolUse lint-on-edit + Stop test-runner (see Issue #20); PostToolUse commit-signal (tests) + commit-signal (tasks) in `.claude/hooks/`; pre-commit gitleaks via `.husky/pre-commit` (see Issue #25)
- **MCP:** GitHub, Vercel, Stitch, and Playwright MCP servers via `.mcp.json` (see Issue #21)
- **Agents:** `.claude/agents/` — architect, planner, tdd-guide, code-reviewer, security-reviewer, build-error-resolver, e2e-runner
- **Skills:** `.claude/skills/` — architecture-decision-records, coding-standards, backend-patterns, e2e-testing, tdd-workflow, verification-loop, fix-issue

---

@docs/architecture.md
@docs/testing-strategy.md
@docs/security.md
