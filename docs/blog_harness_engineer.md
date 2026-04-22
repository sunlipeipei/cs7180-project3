# We Are Harness Engineers

When our team set out to build **BypassHire** — an AI tool that cuts job-application time from 45 minutes to under 5 — we quickly realized that the interesting engineering challenge wasn't the model. The model was the easy part. The hard part was everything around it.

Martin Fowler recently named that surrounding layer: **harness engineering**. A harness is everything in a coding-agent setup except the model itself — the guides, sensors, rules, and scaffolding that determine whether the agent produces something you can trust. We spent a significant portion of our sprint designing exactly that, and this post describes what we built and why.

## Guides: Steering the Agent Before It Writes a Line

Fowler divides harness mechanisms into two categories. **Guides** are feedforward controls — they anticipate problems and shape behavior upfront.

Our primary guide is `CLAUDE.md`, a project-level instruction file that encodes our conventions, enforced workflow order (`/plan → /tdd → /build-fix → /code-review → /verify`), security rules, and coverage thresholds. Every session starts with Claude reading this file. It establishes the rules of the game before any code is generated.

Beyond static documentation, we deployed a suite of **specialized sub-agents** — architect, planner, tdd-guide, code-reviewer, security-reviewer, and build-error-resolver — each scoped to a specific responsibility. The security-reviewer, for instance, is OWASP-scoped and fires on any PR touching auth routes, DB queries, or Claude API prompts. Rather than one general-purpose agent deciding everything, we built a council of narrow experts. Specialization reduces the surface area each agent must reason over, which increases reliability.

MCP server integrations (GitHub, Playwright, Vercel) extend the agent's reach into external systems without loosening its guardrails. The agent can check deployment status or run a browser test; it cannot make unreviewed changes to production.

## Sensors: Catching Problems After the Fact

**Sensors** are feedback controls — they observe what was generated and signal corrections. This is where Claude Code's hook system becomes infrastructure.

We run **four hooks** wired into the session lifecycle:

- **Lint on edit:** ESLint and Prettier fire immediately after any `.ts` or `.tsx` file is touched. The feedback loop collapses to milliseconds.
- **Test-runner guard on exit:** When Claude tries to end the session, `npm test` runs automatically. If tests fail, the session is blocked from closing. "I'll fix it later" becomes structurally impossible.
- **Green-test commit signal:** After any test-runner Bash call exits 0, a hook injects a nudge asking whether to checkpoint. Signal only — Claude decides; the hook never runs `git commit` itself.
- **Task-completion commit signal:** When a todo transitions to `completed`, a snapshot diff fires the same nudge for that work slice.

Fowler distinguishes **computational** sensors (fast, deterministic: linters, type checkers, tests) from **inferential** ones (AI-powered, slower, but semantically richer). Our hooks are computational. Our code-review and security-reviewer sub-agents are inferential — they catch the architectural and behavioral issues that linters cannot see.

## Harnessability: The Stack Matters

Not every codebase is equally amenable to harnesses. Fowler calls this **harnessability** — the structural properties that make a system legible to agents. We chose TypeScript, Prisma, Zod, and Next.js App Router deliberately. Strong types, a schema-validated ORM, and runtime input validation at every API boundary give both human reviewers and agent sensors precise, machine-readable contracts to work against. The harness is only as good as the surface it grips.

## The Steering Loop

Fowler's most important insight is that harnesses require a **steering loop** — humans monitoring repeated failures and tightening controls in response. After our first sprint, we noticed Claude occasionally drifted on auth patterns; we added an ESLint rule that bans direct imports from `@clerk/nextjs/server`, forcing all auth through our `src/lib/auth` wrapper. The harness got smarter because we observed where it was failing.

That loop — observe, encode, enforce — is the actual job of a harness engineer. The model handles generation. We handle the system that keeps generation honest.
