# Final Delivery Index — CS7180 Project 3 (BypassHire)

**Submission date:** 2026-04-21
**Team:** Lipeipei Sun (sunlipeipei), Qi Wei (iDako7 / dako7777777)
**Repository:** `cs7180-project3`

This directory collects the final-submission deliverables. Some artifacts live at their canonical GitHub-convention paths (repo root, `.github/`, sprint docs folder) and are linked from here so the grader can find everything from one page.

---

## Submission Deliverables

| # | Deliverable | Link |
|---|---|---|
| 1 | GitHub Repository | https://github.com/sunlipeipei/cs7180-project3 |
| 2 | Deployed Application | https://bypasshire.vercel.app/ |
| 3 | CI/CD Pipeline (GitHub Actions) | https://github.com/sunlipeipei/cs7180-project3/actions |
| 4 | Technical Blog Post | https://dev.to/neo_efecd668f2fc8966c7e72/my-first-foray-into-harness-engineers-j3p |
| 5 | Video Demonstration (5–10 min) | https://drive.google.com/file/d/19jyiEjYbVLlyiUFrqVuEu1EWNqPxNEdA/view?usp=sharing |
| 6 | Individual Reflection — Qi Wei | [`reflection-Qi_Wei.md`](./reflection-Qi_Wei.md) |
| 7 | Individual Reflection — Lipeipei | [`reflection-Lipeipei.md`](./reflection-Lipeipei.md) |
| 8 | Showcase Google Form | https://docs.google.com/forms/d/e/1FAIpQLScT67tnwjhIETSRwADt57TS_THJSeSGf-xrjTV2nm-XvfFELg/viewform?usp=dialog |

---

## Rubric-area map

| Rubric area | Artifact | Path |
|---|---|---|
| Documentation & Demo | README with Mermaid architecture diagram | [`/README.md`](../../README.md) |
| Documentation & Demo | Technical blog post (Claude Code mastery) | [`blog-post.md`](./blog-post.md) |
| Documentation & Demo | Individual reflection — Qi Wei (550 words) | [`reflection-Qi_Wei.md`](./reflection-Qi_Wei.md) |
| Team Process | Sprint 1 planning | [`/docs/archive/sprints/sprint-1-planning.md`](../archive/sprints/sprint-1-planning.md) |
| Team Process | Sprint 1 retrospective | [`/docs/archive/sprints/sprint-1-retro.md`](../archive/sprints/sprint-1-retro.md) |
| Team Process | Sprint 2 planning | [`/docs/phase_1-2/sprint-2-planning.md`](../phase_1-2/sprint-2-planning.md) |
| Team Process | Sprint 2 retrospective | [`/docs/phase_1-2/sprint-2-retro.md`](../phase_1-2/sprint-2-retro.md) |
| Team Process | Sprint 2 async standups (9 entries) | [`/docs/phase_1-2/sprint-2-standups.md`](../phase_1-2/sprint-2-standups.md) |
| Team Process | Peer evaluation (Qi Wei → Lipeipei) | [`peer-evaluation-Qi_Wei.md`](./peer-evaluation-Qi_Wei.md) |
| Team Process | Peer evaluation (Lipeipei → Qi Wei) | [`peer-evaluation-Lipeipei_to_Qi.md`](./peer-evaluation-Lipeipei_to_Qi.md) |
| Claude Code Mastery | Parallel worktree evidence (+ screenshots) | [`worktree-evidence.md`](./worktree-evidence.md) |
| Claude Code Mastery | CLAUDE.md with @imports | [`/CLAUDE.md`](../../CLAUDE.md) |
| Claude Code Mastery | Custom skills (9: fix-issue v2, tdd-workflow, verify, architecture-decision-records, backend-patterns, coding-standards, e2e-testing, playwright-cli, react-components) | [`/.claude/skills/`](../../.claude/skills/) |
| Claude Code Mastery | Skills usage evidence (session logs — /fix-issue, /tdd, /verify invocations) | [`session-logs/session-log-skills.md`](./session-logs/session-log-skills.md) |
| Claude Code Mastery | Hooks configuration (4 Claude hooks + gitleaks pre-commit) | [`/.claude/settings.json`](../../.claude/settings.json), [`/.husky/pre-commit`](../../.husky/pre-commit) |
| Claude Code Mastery | MCP servers config | [`/CLAUDE.md` (MCP section)](../../CLAUDE.md) |
| Claude Code Mastery | MCP usage evidence (GitHub MCP for SSRF-safe context extraction; Playwright MCP for interactive E2E) | [`session-logs/session-log-mcp.md`](./session-logs/session-log-mcp.md) |
| Claude Code Mastery | Custom agents (7: architect, planner, tdd-guide, code-reviewer, security-reviewer, build-error-resolver, e2e-runner) | [`/.claude/agents/`](../../.claude/agents/) |
| Claude Code Mastery | Agent usage evidence (planner plan, security-reviewer A03 finding, code-reviewer C.L.E.A.R. on PR #62, architect ADR) | [`session-logs/session-log-agents.md`](./session-logs/session-log-agents.md) |
| Claude Code Mastery | Writer/Reviewer PRs with C.L.E.A.R. review comments | [PR #60](https://github.com/sunlipeipei/cs7180-project3/pull/60) · [PR #62](https://github.com/sunlipeipei/cs7180-project3/pull/62) |
| CI/CD & Security | GitHub Actions CI | [`/.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| CI/CD & Security | PR template (C.L.E.A.R. + AI disclosure + security DoD) | [`/.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md) |
| CI/CD & Security | OWASP Top 10 doc | [`/docs/security.md`](../security.md) |
| CI/CD & Security | Gitleaks pre-commit hook + config | [`/.husky/pre-commit`](../../.husky/pre-commit), [`/.gitleaks.toml`](../../.gitleaks.toml) |
| CI/CD & Security | Gitleaks CI enforcement (security job) | [`/.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| CI/CD & Security | Security sub-agent (OWASP-scoped reviewer) | [`/.claude/agents/security-reviewer.md`](../../.claude/agents/security-reviewer.md) |
| Testing & TDD | Implementation plan with 3 RED→GREEN pairs cited | [`/docs/phase_1-2/implementation-plan.md`](../phase_1-2/implementation-plan.md) |
| Application Quality | Architecture doc | [`/docs/architecture.md`](../architecture.md) |
| Application Quality | Product requirements (PRD) | [`/docs/PRD_Resume_Refine_AutoFill_Tool.md`](../PRD_Resume_Refine_AutoFill_Tool.md) |

---

## Outstanding placeholders for human fill-in

Before submission, complete these items:

1. **README** — replace `[Vercel deploy — ongoing, URL TBD]` with the production URL once Issue #24 lands.
2. **README screenshots** — optional polish: capture six PNGs under `docs/final_delivery/screenshots/` (sign-in, dashboard, profile upload, tailor page, refine, PDF output). Rubric evidence for skills/MCP/agents is covered by session logs in `session-logs/`.
3. **Worktree evidence screenshots** — two `[VERIFY]` markers for pruned worktree paths in `worktree-evidence.md` §Screenshots. Git branch history and PR timestamps already provide parallel-development proof.
4. **Blog post** — one `[VERIFY]` marker (line 71) about `.mcp.json` location.
5. **Reflection** (`reflection-Qi_Wei.md`) — two `[DAKO VOICE]` markers for personal anecdotes (Stop hook moment + one planner-limitation memory). File exists at `docs/final_delivery/reflection-Qi_Wei.md` but is untracked — commit it.
6. **Peer evaluation** — rating checkboxes (1–5 scale) + overall-rating box + summary paragraph + peer-adjustment recommendation.
7. **Sprint 2 standups** — Lipeipei's Apr 12 / 14 / 17 / 19 entries describe review/planning activity without git-commit evidence on those dates; either trim to match her real commit dates (primarily Apr 20) or reframe as non-code activity with explicit markers.
8. **Sprint 2 planning** — assignee columns show `(none)` for issues where GitHub assignees were not set; cross-check against actual commit authorship if grader scrutinizes.

---

## Still-open issues blocking full rubric score

These are tracked in GitHub. They are not documentation artifacts, but they gate the final grade:

| Issue | Summary | Rubric impact |
|---|---|---|
| #24 | Complete CI/CD: E2E + security scan + AI review + Vercel prod deploy | CI/CD & Production (35 pts) |
| ~~#29~~ ✓ | Writer/Reviewer PRs w/ C.L.E.A.R. + AI disclosure — [PR #60](https://github.com/sunlipeipei/cs7180-project3/pull/60), [PR #62](https://github.com/sunlipeipei/cs7180-project3/pull/62) | Claude Code Mastery |
| #63 | Rubric evidence checklist (grader-facing) | Documentation |

### Resolved after sprint close

- **#25** — Gitleaks pre-commit + security sub-agent. Shipped on `worktree-issue-25-security-gates`: `.husky/pre-commit` (advisory local hook), `.gitleaks.toml` (rules + allowlist), `gitleaks/gitleaks-action@v2` step in the CI `security` job (enforced), `.claude/agents/security-reviewer.md` (OWASP-scoped sub-agent), PR template security DoD already on main. Stretch not shipped: headless Claude Code agent run in CI — deferred; local `/agents security-reviewer` covers the review workflow.
- **#29** — Writer/Reviewer PRs w/ C.L.E.A.R. + AI disclosure. C.L.E.A.R. reviewer-agent comments posted on [PR #60](https://github.com/sunlipeipei/cs7180-project3/pull/60) (tailor engine) and [PR #62](https://github.com/sunlipeipei/cs7180-project3/pull/62) (PDF export) by Claude Code reviewer sub-agent (Sonnet 4.6).

---

## External-submission deliverables not in this repo

Per the professor's rubric these are submitted elsewhere:

1. **Video demonstration** (5–10 min) — https://drive.google.com/file/d/19jyiEjYbVLlyiUFrqVuEu1EWNqPxNEdA/view?usp=sharing
2. **Showcase submission** — https://docs.google.com/forms/d/e/1FAIpQLScT67tnwjhIETSRwADt57TS_THJSeSGf-xrjTV2nm-XvfFELg/viewform?usp=dialog (submit once Vercel URL is ready)
3. **Published blog post** — https://dev.to/neo_efecd668f2fc8966c7e72/my-first-foray-into-harness-engineers-j3p (source draft: [`blog-post.md`](./blog-post.md))
4. **Peer evaluations (per partner)** — submitted via the form the professor provides; drafts in this directory prepare the content.

---

## How to use this directory for grading

1. Start with [`/README.md`](../../README.md) for project overview and Mermaid architecture.
2. Read [`blog-post.md`](./blog-post.md) for the Claude Code mastery narrative (skills, hooks, MCP, subagents, worktrees).
3. Browse the sprint docs under [`/docs/archive/sprints/`](../archive/sprints/) (Sprint 1) and [`/docs/phase_1-2/`](../phase_1-2/) (Sprint 2) for team process.
4. Check [`worktree-evidence.md`](./worktree-evidence.md) for parallel development evidence.
5. Review [`/.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md) for C.L.E.A.R. + AI disclosure + security DoD enforcement on PRs.
6. Read [`reflection-Qi_Wei.md`](./reflection-Qi_Wei.md) (Qi Wei) and [`reflection-Lipeipei.md`](./reflection-Lipeipei.md) (Lipeipei) for individual insights.
7. Implementation-level TDD evidence lives in [`/docs/phase_1-2/implementation-plan.md`](../phase_1-2/implementation-plan.md) (3 RED→GREEN pairs cited with SHAs).
