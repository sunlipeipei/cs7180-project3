# Session Log — MCP Server Usage

**Project:** BypassHire — GitHub context extraction + E2E testing
**Dates:** 2026-04-16 to 2026-04-19
**MCP servers demonstrated:** `github` (ghcr.io/github/github-mcp-server), `playwright` (@playwright/mcp)
**Claude Code Model:** Claude Sonnet 4.6

---

## GitHub MCP — Context Extraction (FR-1.3)

**Purpose:** Pull README, language stats, and file tree from a candidate's GitHub repo to enrich the tailor prompt with project context, without allowing direct `fetch(userUrl)` calls (SSRF mitigation — see `docs/security.md` §A10).

### Session: Phase 1.B setup — wiring GitHub MCP into tailor prompt

**Tool invocation (Claude Code session):**

```
Claude Code invoked tool: mcp__github__get_file_contents
  Input:
    owner: "torvalds"
    repo: "linux"
    path: "README"
  Output (truncated):
    "Linux kernel\n\nThere are several guides for kernel developers and users..."

Claude Code invoked tool: mcp__github__search_repositories
  Input:
    query: "user:torvalds stars:>100"
  Output:
    [{ "name": "linux", "language": "C", "stargazers_count": 178000, ... }]
```

> **[ANNOTATION — MCP vs direct fetch]**
> The GitHub MCP server (`ghcr.io/github/github-mcp-server`) runs as a Docker container and proxies all GitHub API calls through the server's auth token. Claude Code never makes raw HTTP requests to user-supplied URLs. This satisfies the SSRF requirement in `docs/security.md` §A10: GitHub repo URLs are validated against the allowlist pattern, then passed to the MCP tool — not to `fetch()` directly.

**Config:** `.mcp.json` (repo root) → `"github"` entry, `GITHUB_PERSONAL_ACCESS_TOKEN` in `.env`.

### Result integrated into tailor prompt

The extracted README and language stats are inserted into the tailor prompt under a `<github_context>` delimiter (same injection-safe pattern as `<job_description>` — see `docs/security.md` §A03).

---

## Playwright MCP — E2E Testing (PR #64)

**Purpose:** Use the official Microsoft `@playwright/mcp` server to drive browser automation from within Claude Code sessions — navigate the deployed app, fill forms, assert on DOM state — without switching to a separate terminal.

### Session: E2E golden-path test via Playwright MCP

**Branch:** `worktree-e2e` (separate worktree, added after phase-1 PRs landed)
**Commits:** `ebff9f4`, `3ee8c59`

#### Step 1 — Navigate to the app

```
Claude Code invoked tool: mcp__playwright__browser_navigate
  Input: { "url": "http://localhost:3000" }
  Output: "Navigated to http://localhost:3000, title: 'BypassHire'"
```

#### Step 2 — Snapshot the landing page

```
Claude Code invoked tool: mcp__playwright__browser_snapshot
  Output (accessibility tree excerpt):
    role=heading name="Bypass the black box"
    role=button name="Get started"
    role=link name="Sign in"
```

> **[ANNOTATION — snapshot vs screenshot]**
> The Playwright MCP `browser_snapshot` tool returns an accessibility tree rather than a pixel image. This is faster and more stable for assertions — no flakiness from rendering differences. Screenshots are reserved for visual regressions.

#### Step 3 — Sign in and reach dashboard

```
Claude Code invoked tool: mcp__playwright__browser_click
  Input: { "element": "Sign in button", "ref": "e12" }

Claude Code invoked tool: mcp__playwright__browser_fill_form
  Input: {
    "fields": [
      { "label": "Email", "value": "test@bypasshire.dev" },
      { "label": "Password", "value": "test-password-e2e" }
    ]
  }

Claude Code invoked tool: mcp__playwright__browser_wait_for
  Input: { "text": "Dashboard", "timeout": 5000 }
  Output: "Element found"
```

#### Step 4 — Upload resume and trigger tailor

```
Claude Code invoked tool: mcp__playwright__browser_file_upload
  Input: {
    "element": "Resume upload area",
    "files": ["tests/fixtures/sample-resume.pdf"]
  }

Claude Code invoked tool: mcp__playwright__browser_fill_form
  Input: {
    "fields": [
      { "label": "Job description", "value": "Senior Software Engineer at Acme Corp..." }
    ]
  }

Claude Code invoked tool: mcp__playwright__browser_click
  Input: { "element": "Tailor resume button" }

Claude Code invoked tool: mcp__playwright__browser_wait_for
  Input: { "text": "Your tailored resume is ready", "timeout": 30000 }
  Output: "Element found"
```

#### Step 5 — Assert PDF download

```
Claude Code invoked tool: mcp__playwright__browser_click
  Input: { "element": "Download PDF button" }

Claude Code invoked tool: mcp__playwright__browser_console_messages
  Output: []   ← no JS errors during download
```

> **[ANNOTATION — MCP-driven E2E vs standalone Playwright]**
> Using Playwright MCP inside Claude Code means the agent can observe the app state in real-time and adjust its next action based on what it sees — unlike a pre-written Playwright script that fails opaquely. Once the golden path was confirmed interactively, Claude Code generated the spec file (`tests/e2e/tailor-flow.spec.ts`) from the same steps. The spec is deterministic; the MCP session was exploratory.

**Config:** `.mcp.json` (repo root) → `"playwright"` entry, no credentials required.

---

## Playwright MCP — Loading State E2E (PR #64, commit `3ee8c59`)

A second Playwright MCP session on the `worktree-e2e` branch confirmed loading-state behavior:

```
Claude Code invoked tool: mcp__playwright__browser_click
  Input: { "element": "Tailor resume button" }

Claude Code invoked tool: mcp__playwright__browser_snapshot
  Output (immediately after click):
    role=progressbar name="Tailoring your resume..."
    role=button name="Tailor resume button" aria-disabled=true
```

This confirmed the loading spinner renders and the button disables during the API call — a regression that a unit test cannot catch. Added as a separate `describe` block in the E2E spec.
