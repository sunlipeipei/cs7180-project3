# Project 3: Production Application with Claude Code Mastery

- Due: Tuesday by 11:59pm
- Points: 200
- Weight: 19% of final grade
- Submission types: text entry box, website URL, or file upload

<details>
<summary>Table of contents</summary>

- [Objective](#objective)
- [Approval Requirement](#approval-requirement)
- [Requirements](#requirements)
  - [Functional Requirements](#functional-requirements)
  - [Technical Requirements](#technical-requirements)
    - [Architecture](#architecture)
    - [Claude Code Mastery](#claude-code-mastery)
      - [CLAUDE.md & Memory (W10)](#claude-md-and-memory-w10)
      - [Custom Skills (W12) - minimum 2](#custom-skills-w12)
      - [Hooks (W12) - minimum 2](#hooks-w12)
      - [MCP Servers (W12) - minimum 1](#mcp-servers-w12)
      - [Agents (W12-W13) - minimum 1](#agents-w12-w13)
      - [Parallel Development (W12)](#parallel-development-w12)
      - [Writer/Reviewer Pattern + C.L.E.A.R. (W12)](#writer-reviewer-pattern-clear-w12)
    - [Test-Driven Development (W11)](#test-driven-development-w11)
    - [CI/CD Pipeline (W14) - GitHub Actions](#cicd-pipeline-w14)
    - [Security (W14) - minimum 4 gates from the 8-gate pipeline](#security-w14)
  - [Team Process](#team-process)
- [Deliverables](#deliverables)
- [Rubric (200 points)](#rubric)
  - [Rubric Summary](#rubric-summary)
  - [Bonus](#bonus)
  - [Peer Evaluation Adjustment](#peer-evaluation-adjustment)
  - [Detailed Rubric](#detailed-rubric)
    - [Application Quality](#application-quality)
    - [Claude Code Mastery](#claude-code-mastery-rubric)
    - [Testing & TDD](#testing-and-tdd-rubric)
    - [CI/CD & Production](#cicd-and-production-rubric)
    - [Team Process](#team-process-rubric)
    - [Documentation & Demo](#documentation-and-demo-rubric)
- [Total Points](#total-points)

</details>

<a id="objective"></a>
## Objective

Build a production-grade, deployed application as a pair, demonstrating mastery of Claude Code's extensibility features, professional AI-assisted workflows, and production engineering practices taught in W10-W14.

<a id="approval-requirement"></a>
## Approval Requirement

Project idea must be approved by the professor on the `#projects` Slack channel at least one week before the deadline.

<a id="requirements"></a>
## Requirements

<a id="functional-requirements"></a>
### Functional Requirements

- Production-ready application solving a real problem
- 2+ user roles or distinct feature areas
- Real-world use case (new idea)
- Portfolio/interview-worthy quality
- Deployed and accessible via public URL

<a id="technical-requirements"></a>
### Technical Requirements

<a id="architecture"></a>
#### Architecture

- Next.js full-stack application (App Router or Pages Router)
- Database (PostgreSQL recommended, or equivalent)
- Authentication (Auth.js/NextAuth, Clerk, or equivalent)
- Deployed on Vercel (or equivalent platform with preview deploys)

<a id="claude-code-mastery"></a>
#### Claude Code Mastery (core of this project)

Each of the following Claude Code concepts must be demonstrated with evidence in your repository:

<a id="claude-md-and-memory-w10"></a>
##### CLAUDE.md & Memory (W10)

- Comprehensive `CLAUDE.md` with `@imports` for modular organization
- Auto-memory usage for persistent project context
- Evidence of `CLAUDE.md` evolution across the project (visible in git history)
- Project conventions, architecture decisions, and testing strategy documented

<a id="custom-skills-w12"></a>
##### Custom Skills (W12) - minimum 2

- At least 2 skills in `.claude/skills/` (e.g. `/fix-issue`, `/add-feature`, `/deploy`, `/create-pr`)
- Evidence of team usage (session logs or screenshots)
- At least one skill iterated from v1 to v2 based on real usage

<a id="hooks-w12"></a>
##### Hooks (W12) - minimum 2

- At least 2 hooks configured in `.claude/settings.json`
- At least one PreToolUse or PostToolUse hook (e.g. auto-format, block protected files, lint-on-edit)
- At least one quality-enforcement hook (e.g. Stop hook that runs tests)

<a id="mcp-servers-w12"></a>
##### MCP Servers (W12) - minimum 1

- At least 1 MCP server integrated (database, Playwright, GitHub, or other)
- Configuration shared via `.mcp.json` in repository
- Evidence of use in development workflow (session logs or screenshots)

<a id="agents-w12-w13"></a>
##### Agents (W12-W13) - minimum 1 (choose any)

- Custom sub-agents in `.claude/agents/` (e.g. `security-reviewer`, `test-writer`), OR
- Agent teams with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, OR
- Agent SDK feature built into the application (applying W13 patterns)
- Evidence of use (session log, PR, or screenshots showing agent output)

<a id="parallel-development-w12"></a>
##### Parallel Development (W12)

- Evidence of worktree usage for parallel feature development
- At least 2 features developed in parallel (visible in git branch history)

<a id="writer-reviewer-pattern-clear-w12"></a>
##### Writer/Reviewer Pattern + C.L.E.A.R. (W12)

- At least 2 PRs using the writer/reviewer pattern (one agent writes, another reviews)
- C.L.E.A.R. framework applied in PR reviews (visible in PR comments)
- AI disclosure metadata in PRs (% AI-generated, tool used, human review applied)

<a id="test-driven-development-w11"></a>
#### Test-Driven Development (W11)

- TDD workflow (red-green-refactor) for at least 3 features
- Git history showing failing tests committed before implementation
- Unit + integration tests (Vitest or Jest)
- At least 1 E2E test (Playwright)
- 70%+ test coverage

<a id="cicd-pipeline-w14"></a>
#### CI/CD Pipeline (W14) - GitHub Actions

- Lint (ESLint + Prettier)
- Type checking (`tsc --noEmit`)
- Unit and integration tests
- E2E tests (Playwright)
- Security scan (`npm audit`)
- AI PR review (`claude-code-action` or `claude -p`)
- Preview deploy (Vercel)
- Production deploy on merge to `main`

<a id="security-w14"></a>
#### Security (W14) - minimum 4 gates from the 8-gate pipeline

- Pre-commit secrets detection (Gitleaks or equivalent)
- Dependency scanning (`npm audit` in CI)
- At least one SAST tool or security-focused sub-agent
- Security acceptance criteria in Definition of Done
- OWASP top 10 awareness documented in `CLAUDE.md`

<a id="team-process"></a>
### Team Process

- 2 sprints documented (sprint planning + retrospective each)
- GitHub Issues with acceptance criteria as testable specifications
- Branch-per-issue workflow with PR reviews
- Async standups (minimum 3 per sprint per partner)
- C.L.E.A.R. framework applied in PR reviews
- Peer evaluations

<a id="deliverables"></a>
## Deliverables

1. GitHub repository with full `.claude/` configuration (skills, hooks, agents, MCP)
2. Deployed application (Vercel production URL)
3. CI/CD pipeline (GitHub Actions, all stages passing)
4. Technical blog post (published on Medium, dev.to, or similar)
5. Video demonstration (5-10 min, showcasing app + Claude Code workflow)
6. Individual reflections (one per partner, 500 words)
7. **Showcase submission** via [Google Form](https://docs.google.com/forms/d/e/1FAIpQLScT67tnwjhIETSRwADt57TS_THJSeSGf-xrjTV2nm-XvfFELg/viewform?usp=dialog) (project name, URLs, thumbnail, video, blog)

<a id="rubric"></a>
## Rubric (200 points)

<a id="rubric-summary"></a>
### Rubric Summary

| Category | Points | Description |
| --- | ---: | --- |
| Application Quality | 40 | Production-ready, deployed, polished, real use case |
| Claude Code Mastery | 55 | Skills, hooks, MCP, agents, `CLAUDE.md`/memory, worktrees, C.L.E.A.R. |
| Testing & TDD | 30 | TDD workflow, coverage, test pyramid |
| CI/CD & Production | 35 | Pipeline stages, AI review, Vercel deploy, security gates |
| Team Process | 25 | Sprints, PRs, C.L.E.A.R. reviews, async standups, peer evals |
| Documentation & Demo | 15 | README, blog post, video demo, reflections |

<a id="bonus"></a>
### Bonus

Bonus is worth up to 10 extra points:

- Property-based testing with `fast-check` (+3)
- Mutation testing with Stryker (+3)
- Agent SDK feature applying W13 patterns (+4)

<a id="peer-evaluation-adjustment"></a>
### Peer Evaluation Adjustment

Individual grades adjusted by peer evaluations (+/-10%).

<a id="detailed-rubric"></a>
### Detailed Rubric

<a id="application-quality"></a>
#### Application Quality

| Rating | Points | Description |
| --- | ---: | --- |
| Excellent | 40 | Production-ready, deployed on Vercel, polished UI, 2+ user roles, real problem solved, portfolio-worthy |
| Good | 30 | Deployed, core features work, good UX, minor gaps |
| Satisfactory | 20 | Functional app, basic UI, partially deployed |
| Needs Improvement | 10 | Incomplete features, not deployed or broken |
| Unsatisfactory | 0 | Major functionality broken or missing |

<a id="claude-code-mastery-rubric"></a>
#### Claude Code Mastery

| Rating | Points | Description |
| --- | ---: | --- |
| Excellent | 55 | Rich `CLAUDE.md` with `@imports` and git evolution; 2+ iterated skills with usage evidence; 2+ hooks enforcing quality; MCP server integrated via `.mcp.json`; agents (sub-agents/teams/SDK) with evidence; parallel worktree development; 2+ PRs with writer/reviewer + C.L.E.A.R. + AI disclosure |
| Good | 42 | Functional `CLAUDE.md` with iteration; 2 skills and 2 hooks configured; MCP and agents present with some usage evidence; some parallel development; C.L.E.A.R. applied on some PRs |
| Satisfactory | 28 | Basic `CLAUDE.md`; 1-2 skills/hooks with limited use; MCP or agents configured but minimal evidence; limited parallel work or C.L.E.A.R. usage |
| Needs Improvement | 14 | Minimal `CLAUDE.md`; missing multiple Claude Code features (skills, hooks, MCP, or agents); no parallel development or C.L.E.A.R. evidence |
| Unsatisfactory | 0 | No meaningful Claude Code extensibility demonstrated |

<a id="testing-and-tdd-rubric"></a>
#### Testing & TDD

| Rating | Points | Description |
| --- | ---: | --- |
| Excellent | 30 | TDD red-green-refactor for 3+ features visible in git; 70%+ coverage; unit + integration + E2E (Playwright); tests verify behavior and edge cases |
| Good | 22 | TDD for some features; adequate coverage; unit + integration tests present; functional test quality |
| Satisfactory | 15 | Some tests written (may be after code); low coverage; missing test types |
| Needs Improvement | 8 | Minimal tests, no TDD evidence, trivial assertions |
| Unsatisfactory | 0 | No meaningful testing |

<a id="cicd-and-production-rubric"></a>
#### CI/CD & Production

| Rating | Points | Description |
| --- | ---: | --- |
| Excellent | 35 | All 8 pipeline stages green (lint, typecheck, tests, E2E, security, AI review, preview, prod deploy); 4+ security gates; OWASP in `CLAUDE.md` |
| Good | 26 | 5-7 pipeline stages; AI review configured; 3 security gates |
| Satisfactory | 18 | 3-4 pipeline stages; partial security scanning |
| Needs Improvement | 9 | Fewer than 3 stages; minimal security |
| Unsatisfactory | 0 | No CI/CD pipeline or production infrastructure |

<a id="team-process-rubric"></a>
#### Team Process

| Rating | Points | Description |
| --- | ---: | --- |
| Excellent | 25 | 2 sprints with planning + retrospectives; branch-per-issue with PR reviews; 3+ async standups/sprint/partner; C.L.E.A.R. in reviews; AI disclosure; thoughtful peer evaluation |
| Good | 19 | 2 sprints documented; branch workflow with some PR reviews; standups present; peer evaluation completed |
| Satisfactory | 13 | Basic sprint docs; some branching; minimal standups or reviews |
| Needs Improvement | 6 | Incomplete sprint documentation; no structured workflow |
| Unsatisfactory | 0 | No team process documentation |

<a id="documentation-and-demo-rubric"></a>
#### Documentation & Demo

| Rating | Points | Description |
| --- | ---: | --- |
| Excellent | 15 | Clear README with Mermaid architecture diagram; published blog post with AI workflow insights; polished 5-10 min video demo showcasing app + Claude Code workflow; 500-word reflections with specific Claude Code insights |
| Good | 11 | README present; blog post published; video covers main points; adequate reflections |
| Satisfactory | 8 | Minimal README; draft blog or shallow video; short reflections; video over/under time |
| Needs Improvement | 4 | Missing multiple deliverables; weak or missing video |
| Unsatisfactory | 0 | Missing major documentation or no video |

<a id="total-points"></a>
### Total Points

200
