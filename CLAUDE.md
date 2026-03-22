# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BypassHire** is an AI-powered job application automation tool for software engineers. It combines resume tailoring, interactive editing, and automated form filling to reduce per-application time from 30-60 minutes to under 5 minutes.

**Status:** Pre-implementation (PRD complete, workflow framework in place, no application source code yet). Full requirements are in `docs/PRD_Resume_Refine_AutoFill_Tool.md`.

## Development Workflow

This project uses a Claude Code workflow framework defined in `.claude/` (commands, agents, skills). The prescribed development order is:

```
/plan → /tdd → /build-fix → /code-review → /test-coverage → /e2e → /verify
```

- `/plan` — Design implementation approach before writing code (uses opus-model planner agent)
- `/tdd` — Enforce RED → GREEN → REFACTOR test-driven development
- `/build-fix` — Fix build/type errors with minimal diffs
- `/code-review` — Security (CRITICAL), quality (HIGH), performance (MEDIUM) review
- `/test-coverage` — Find and generate missing tests
- `/e2e` — Generate Playwright end-to-end tests
- `/verify` — Final verification: build + types + lint + tests + git status

## Architecture (Planned 3-Phase System)

**Phase 1 — Resume Tailoring Engine:** Accept job description + user's .docx resume template → extract context from GitHub repos and project documents → generate tailored .docx resume using Claude API.

**Phase 2 — Interactive Editing Interface:** React web app with rich text editor (Tiptap/ProseMirror) for inline comments, AI-driven revisions, diff view, and version history.

**Phase 3 — Auto-Fill Application Forms:** Browser automation (MCP or Chrome Extension) to auto-fill Workday and similar portals, including screening question generation.

## Key Technical Decisions (from PRD)

- **AI Backend:** Anthropic Claude API
- **Document Format:** .docx input/output (use `docx` for Node.js or `python-docx` for Python)
- **Context Sources:** GitHub API for code repos, direct file parsing for project docs
- **Frontend:** React with Tiptap or ProseMirror rich text editor
- **Browser Automation:** MCP servers or Chrome Extension (Workday-specific adapters prioritized)
- **Storage:** Local filesystem for V1 (no cloud backend)

## Enforced Conventions

- **TDD is mandatory** — all tests must be written BEFORE implementation
- **Test coverage minimum: 80%** — 100% for critical paths (auth, core business logic)
- **User confirmation required** before any form submission in the auto-fill phase
