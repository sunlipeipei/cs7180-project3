---
description: Analyze system architecture, evaluate trade-offs, and produce ADRs. Use for system-level design decisions, not feature-level planning.
---

# Architect Command

This command invokes the **architect** agent for system-level architectural analysis and decision-making for BypassHire.

## What This Command Does

1. **Review current architecture** — read `docs/architecture.md`, `docs/security.md`, `docs/testing-strategy.md`, and the PRD
2. **Analyze trade-offs** — evaluate competing approaches with pros/cons grounded in the project's constraints
3. **Produce ADRs** — record decisions in `docs/adr/NNNN-title.md` using the project's established ADR format
4. **Wait for confirmation** — MUST receive explicit user approval before finalizing a decision

## When to Use

Use `/architect` when:

- Designing how components interact across the stack (Next.js routes, Prisma, Claude API, Clerk, browser extension)
- Choosing between Server Actions and App Router API routes, or between Route Handlers and tRPC-style patterns
- Evaluating whether to change an existing architectural decision (e.g., switching DB access pattern, auth flow, or AI-layer boundary)
- Adding a new component that crosses layer boundaries (e.g., introducing a job queue, cache, or external service)
- Deciding how the Phase 3 browser extension should communicate with the Phase 2 backend

Use `/plan` instead when:

- Implementing a specific feature step by step
- Breaking down a known task into phases with file paths
- The system shape is already decided and you need an execution plan

## How It Works

The architect agent will:

1. **Read project docs** — `docs/architecture.md`, `docs/security.md`, `docs/testing-strategy.md`, `docs/PRD_Resume_Refine_AutoFill_Tool.md`
2. **Check existing ADRs** — scan `docs/adr/` (creates the directory on first use)
3. **Analyze the question** — evaluate options against Clerk auth scoping, Zod validation, no-auto-submit, coverage thresholds, and phase boundaries
4. **Present recommendation** — with trade-off analysis and a formal ADR if the decision is significant
5. **Wait for confirmation** — before finalizing any decision

## Example Usage

```
User: /architect Should JD intake be a Server Action or an App Router API route?

Agent (architect):
# Architecture Analysis: JD Intake Endpoint

## Context
Phase 1 FR-1.1 accepts a job description (paste or URL). The endpoint runs a
Zod-validated write into Prisma and scopes to the Clerk userId. We need to choose
between a Server Action and an App Router /api route.

## Analysis
- Server Actions: colocated with the form, type-safe args, cheaper boilerplate,
  but harder to reuse from the future browser extension (Phase 3).
- App Router /api route: stable URL contract, reusable by the extension and any
  external client, trivial to rate-limit via middleware. Extra serialization cost
  versus Server Actions.
- Both honor Clerk auth() for userId scoping (A01).
- Both let us wrap Zod validation at the boundary before Prisma.
- Tests: /api route is straightforward to integration-test against Neon; Server
  Actions require Next test harness setup.

## Recommendation
**Use an App Router /api route at `app/api/jd/route.ts`.** The Phase 3 extension
is a near-term consumer of the same endpoint, and stable URL contracts simplify
both tests and future clients. The small serialization cost is not a bottleneck
in Phase 1.

This aligns with:
- docs/architecture.md (API routes as the canonical server boundary)
- docs/security.md A01 (server-side auth()) and A03 (Zod at the boundary)
- PRD FR-1.1 (JD intake) and FR-3.x (extension reuse)

## ADR
ADR-1: Prefer App Router /api routes over Server Actions for endpoints
consumed by both the web app and the Phase 3 browser extension.

## Impact
- New file: app/api/jd/route.ts with POST handler
- Shared Zod schema in src/profile/ or a new src/jd/ module
- No changes to existing Server Actions; this policy applies going forward

**WAITING FOR CONFIRMATION**: Agree with this assessment? (yes/no/modify)
```

## Integration with Other Commands

- Use `/architect` first for system-level decisions, then `/plan` to execute the feature
- Use `/code-review` after implementation to verify architectural alignment
- Use `/tdd` to implement with test-driven development

## Related Agents and Skills

- Invokes the `architect` agent (`.claude/agents/architect.md`)
- Uses the `architecture-decision-records` skill to produce ADRs
