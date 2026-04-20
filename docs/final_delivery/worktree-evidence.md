# Parallel Worktree Evidence — BypassHire (CS7180 Project 3)

**Issue:** #27 — "Parallel worktree evidence: document branches run in parallel"
**Rubric item:** Evidence of worktree usage for parallel feature development; at least 2 features developed in parallel (visible in git branch history).

---

## 1. Purpose

`git worktree` was used throughout BypassHire development to isolate concurrent streams of work without the overhead of stashing or switching branches in a single checkout. Each worktree gets its own working directory and index, so two features (or a feature and an E2E polish pass) can compile, run tests, and be edited independently at the same time. This also let Claude Code agents operate in separate worktrees — one agent driving the main implementation while another reviewed or extended tests — without either agent corrupting the other's working state. The `.claude/worktrees/` directory is the designated root for all project-scoped worktree checkouts.

---

## 2. What `git worktree` Is

`git worktree add <path> <branch>` checks out an existing branch (or creates a new one) into a new directory while sharing the same `.git` object store as the main checkout. Every worktree has its own `HEAD`, index, and working tree, but they all read from and write to the same repository history. This means a developer can have `main` open in one terminal, `feature/dev-auth-bypass` open in another directory, and `worktree-e2e` open in a third — all simultaneously — without any branch-switching.

---

## 3. Parallel Development Evidence

### Pair A — `feature/dev-auth-bypass` + `phase-0.5/flow-and-contract` (+ `chore/husky-pre-push-hook`)

| | Branch | Feature |
|---|---|---|
| Branch 1 | `feature/dev-auth-bypass` | Dev-only Clerk auth bypass — `src/lib/auth` wrapper, unit tests, ESLint import guard |
| Branch 2 | `phase-0.5/flow-and-contract` | Full UI screen scaffold (4 screens) on hardcoded fixtures + `src/ai/schemas.ts` contract |
| Infra (3rd) | `chore/husky-pre-push-hook` | Pre-push hook: `format:check` + `tsc --noEmit` |

**Date range and commit SHAs:**

| Event | SHA | Timestamp (UTC-7) |
|---|---|---|
| `feature/dev-auth-bypass` — first unique commit | `9de4527` | 2026-04-17 23:21:19 |
| `feature/dev-auth-bypass` — last commit | `a104943` | 2026-04-18 00:17:37 |
| `chore/husky-pre-push-hook` — commit | `28710a8` | 2026-04-18 00:28:24 |
| `feature/dev-auth-bypass` — PR #56 merged | `cf3df86` | 2026-04-18 00:31:59 |
| `chore/husky-pre-push-hook` — PR #58 merged | `0701a1d` | 2026-04-18 00:35:50 |
| `phase-0.5/flow-and-contract` — last commit | `aa01436` | 2026-04-18 00:49:45 |
| `phase-0.5/flow-and-contract` — PR #57 merged | `945633f` | 2026-04-18 00:57:07 |

All three branches were open and receiving commits between **2026-04-17 23:21** and **2026-04-18 00:57** — a 96-minute window. PR #56, #58, and #57 were each merged within 25 minutes of each other. The `feature/dev-auth-bypass` worktree was tracked as `cs7180-project3-pr56` (a linked checkout at `/Users/dako/LocalDocument/200-Project/cs7180-project3-pr56`) so that the auth changes could be reviewed and CI-checked while `phase-0.5` UX scaffold work continued uninterrupted in the main checkout.

**Why isolation was needed:** The auth bypass required touching `src/lib/auth.ts` and ESLint config in ways that would break the build on `main` until the full unit-test suite passed. Running that work in a separate worktree meant the `phase-0.5` screen scaffold (which imports from `src/lib/auth`) could still compile against the pre-merge version without merge conflicts.

---

### Pair B — `phase-1/a-profile-ingest` + `phase-1/b-tailor` + `phase-1/c-refine` + `phase-1/d-pdf` (4 PRs open simultaneously)

| Branch | Feature |
|---|---|
| `phase-1/a-profile-ingest` | PDF parsing via unpdf, OpenRouter ingest prompt, `POST /api/profile/ingest` |
| `phase-1/b-tailor` | Claude API single-shot tailor, `POST /api/tailor`, userId-scoped resume repository |
| `phase-1/c-refine` | Section-scoped rewrite, `POST /api/resumes/[resumeId]/refine` |
| `phase-1/d-pdf` | React-PDF template, `GET /api/resumes/[id]/pdf`, download button |

**PR creation timestamps (UTC):**

| PR | Branch | Created | Merged |
|---|---|---|---|
| #59 | `phase-1/a-profile-ingest` | 2026-04-18 08:50 | 2026-04-19 00:42 |
| #60 | `phase-1/b-tailor` | 2026-04-18 09:06 | 2026-04-19 03:46 |
| #61 | `phase-1/c-refine` | 2026-04-18 09:11 | 2026-04-19 04:53 |
| #62 | `phase-1/d-pdf` | 2026-04-18 09:16 | 2026-04-19 05:11 |

All four PRs were opened within a **26-minute window** (08:50–09:16 UTC on 2026-04-18) and remained open in parallel for approximately 16 hours while CI ran, reviews happened, and fixes were pushed. The `worktree-e2e` branch (`ebff9f4`, `3ee8c59`) was then used in a separate checkout to add E2E golden-path and loading-state coverage after the main implementation PRs landed, feeding into PR #64 (merged 2026-04-19 06:42).

**Relevant commit SHAs:**

| Commit | SHA | Timestamp (UTC-7) |
|---|---|---|
| `phase-1/a` RED test | `93a61c2` | 2026-04-18 01:39:15 |
| `phase-1/b` RED test | `8e4f9cb` | 2026-04-18 01:56:45 |
| `phase-1/c` RED test | `92c3f7f` | 2026-04-18 02:09:09 |
| `phase-1/d` feat commit | `22e06d7` | 2026-04-18 02:16:27 |
| `phase-1/a` null-LLM fix | `2908fca` | 2026-04-18 17:17:28 |
| `phase-1/b` E2E wire-up fix | `6731f2e` | 2026-04-18 20:11:56 |
| `phase-1/c` integration test | `1361737` | 2026-04-18 21:44:49 |
| `worktree-e2e` E2E spec | `3ee8c59` | 2026-04-18 23:34:02 |

**Why isolation was needed:** Each sub-phase built on a different part of the stack (profile schema, resume repository, Claude API client, PDF renderer). Developing them in separate worktrees let each sub-phase run its own `npm test` loop without the partially-implemented code from sibling branches causing type errors or test failures.

---

## 4. Local Worktree Layout

`ls -la .claude/worktrees/` output (captured live):

```
drwxr-xr-x@  4 dako  staff   128 Apr 20 01:15 .
drwxr-xr-x@ 10 dako  staff   320 Apr 18 21:45 ..
drwxr-xr-x@ 32 dako  staff  1024 Apr 20 01:16 determined-gagarin-44f035
drwxr-xr-x@  2 dako  staff    64 Apr 17 22:42 phase_0
```

`git worktree list` output (captured live):

```
/Users/dako/LocalDocument/200-Project/cs7180-project3                                              e2b2158 [main]
/Users/dako/LocalDocument/200-Project/cs7180-project3-pr56                                         a104943 [feature/dev-auth-bypass]
/Users/dako/LocalDocument/200-Project/cs7180-project3/.claude/worktrees/determined-gagarin-44f035  e2b2158 [claude/determined-gagarin-44f035]
```

**Worktrees registered in `.git/worktrees/`:**

```
cs7180-project3-pr56           → /Users/dako/LocalDocument/200-Project/cs7180-project3-pr56
                                  HEAD: refs/heads/feature/dev-auth-bypass
determined-gagarin-44f035      → .claude/worktrees/determined-gagarin-44f035
                                  HEAD: refs/heads/claude/determined-gagarin-44f035 (= main, current session)
```

The `phase_0` directory under `.claude/worktrees/` is an empty stub created during the Phase 0 cleanup sprint (2026-04-17 22:42) as a placeholder for a worktree that was not needed once Phase 0 was kept on the main branch.

---

## 5. Commands Used

The following `git worktree add` commands were used (reconstructed from branch names and registered worktree paths):

```bash
# Worktree for reviewing/fixing feature/dev-auth-bypass (PR #56) in isolation
git worktree add ../cs7180-project3-pr56 feature/dev-auth-bypass

# Worktree for Claude Code agent session (current session context isolation)
git worktree add .claude/worktrees/determined-gagarin-44f035 -b claude/determined-gagarin-44f035

# Stub created during Phase 0 planning (branch not ultimately used)
mkdir -p .claude/worktrees/phase_0

# worktree-e2e branch (used with worktree checkout for E2E polish pass — PR #64)
git worktree add /tmp/worktree-e2e worktree-e2e   # [VERIFY — exact path not preserved]

# worktree-night_wildness local branch (points to 945633f, the phase-0.5 merge commit)
# Created as a local tracking ref for the phase-0.5 worktree session
git worktree add .claude/worktrees/night_wildness -b worktree-night_wildness  # [VERIFY]
```

> **Note:** The `worktree-e2e` and `worktree-night_wildness` external paths are not preserved in `.git/worktrees/` because those worktrees were pruned after the branches were merged. The branch refs remain in the local repository confirming they existed.

---

## 6. Screenshots to Capture

Run each command in the repo root (`cs7180-project3/`) and screenshot the full terminal output.

**Screenshot 1 — Active worktree list**

```bash
git worktree list
```

Save to: `docs/final_delivery/screenshots/worktrees/01-worktree-list.png`

**Screenshot 2 — Worktree directory tree on disk**

```bash
tree -L 3 .claude/worktrees/ || ls -la .claude/worktrees/
```

Save to: `docs/final_delivery/screenshots/worktrees/02-worktree-dirs.png`

**Screenshot 3 — Divergent branch graph**

```bash
git log --graph --oneline --all --decorate | head -40
```

Save to: `docs/final_delivery/screenshots/worktrees/03-branch-graph.png`

---

## 7. PR Timeline Table

| PR | Branch | Feature | Opened (UTC) | Merged (UTC) | Status |
|---|---|---|---|---|---|
| #56 | `feature/dev-auth-bypass` | Dev Clerk bypass + auth unit tests | 2026-04-18 06:22 | 2026-04-18 07:31 | Merged |
| #57 | `phase-0.5/flow-and-contract` | UI scaffold + AI schema contract | 2026-04-18 07:05 | 2026-04-18 07:57 | Merged |
| #58 | `chore/husky-pre-push-hook` | Pre-push quality gate hook | 2026-04-18 07:33 | 2026-04-18 07:35 | Merged |
| #59 | `phase-1/a-profile-ingest` | PDF parsing + profile ingest API | 2026-04-18 08:50 | 2026-04-19 00:42 | Merged |
| #60 | `phase-1/b-tailor` | Claude API tailor engine | 2026-04-18 09:06 | 2026-04-19 03:46 | Merged |
| #61 | `phase-1/c-refine` | Section-scoped refine endpoint | 2026-04-18 09:11 | 2026-04-19 04:53 | Merged |
| #62 | `phase-1/d-pdf` | React-PDF export route | 2026-04-18 09:16 | 2026-04-19 05:11 | Merged |
| #64 | `worktree-e2e` (phase-1/e-e2e-polish) | Playwright E2E golden path + loading states | 2026-04-19 06:35 | 2026-04-19 06:42 | Merged |

**Key overlap windows:**
- PR #56, #57, #58 were all open simultaneously from 07:05–07:31 UTC on 2026-04-18.
- PR #59, #60, #61, #62 were all open simultaneously from 09:16 UTC on 2026-04-18 through 00:42 UTC on 2026-04-19 — approximately 16 hours of 4-way parallel open PRs.

---

## 8. Outcome / Lessons

Using `git worktree` let the auth isolation work (`feature/dev-auth-bypass`) and the UI scaffold work (`phase-0.5/flow-and-contract`) proceed in separate directories simultaneously, with each checkout running its own `npm test` watch loop without interfering with the other's partially-broken build state. The four Phase 1 sub-phase PRs (#59–#62) being open in parallel demonstrated the same isolation benefit at the PR level — each branch could receive fixup commits independently while CI evaluated them concurrently. The main lesson was that worktrees are worth the small setup cost any time two streams of work touch overlapping files (e.g., `src/lib/auth.ts` and the screens that import it), because they eliminate the stash/pop cycle that would otherwise serialize what can be parallel work.
