---
name: architecture-decision-records
description: Capture architectural decisions as structured ADRs during coding sessions. Auto-detects decision moments, records context, alternatives considered, and rationale.
origin: adapted from SGA_V2 (ECC) for BypassHire
---

# Architecture Decision Records

Capture architectural decisions as they happen during coding sessions. Instead of decisions living only in conversation history, this skill produces structured ADR documents that live alongside the code.

## ADR Location

BypassHire stores ADRs in a dedicated directory:

- **Path:** `docs/adr/NNNN-kebab-case-title.md` (e.g., `docs/adr/0001-api-routes-over-server-actions.md`)
- **Index:** `docs/adr/README.md` lists every ADR with a one-line summary and date
- **Numbering:** zero-padded 4-digit (`0001`, `0002`, ...) — matches common ADR tooling

If `docs/adr/` does not yet exist, the first ADR recorded via this skill creates the directory and the index file as part of the same change.

## When to Activate

- User explicitly says "let's record this decision" or "ADR this"
- User chooses between significant alternatives (framework, library, pattern, database schema, API design, auth flow)
- User says "we decided to..." or "the reason we're doing X instead of Y is..."
- User asks "why did we choose X?" — read existing ADRs under `docs/adr/`
- During `/architect` or `/plan` runs when architectural trade-offs are discussed

## ADR Format

```markdown
# ADR-NNNN: [Decision title]

- **Status:** Proposed | Accepted | Superseded by ADR-NNNN
- **Date:** YYYY-MM-DD
- **Phase:** 1 (Tailoring) | 2 (Editing) | 3 (Auto-Fill) | Cross-cutting

## Decision
[What we're choosing]

## Context
[What problem prompted this, 2-5 sentences. Reference PRD FR numbers, security acceptance criteria, or coverage thresholds where relevant.]

## Why
[Rationale for the choice — why this over alternatives]

## Alternatives considered
- **[Alternative 1]** — [why not chosen]
- **[Alternative 2]** — [why not chosen]

## Risk
[What could go wrong and mitigation. Include security implications (OWASP categories from docs/security.md) if any.]

## References
- PRD: FR-X.Y
- Security: docs/security.md AXX
- Issue: #NN
```

## Workflow

### Recording a New ADR

1. **Check existing ADRs** — read `docs/adr/README.md` and scan filenames
2. **Number sequentially** — next unused integer, zero-padded to 4 digits
3. **Draft** — use the format above; keep under ~40 lines of body
4. **Check for conflicts** — if the new decision supersedes an existing ADR, set the old one's Status to `Superseded by ADR-NNNN` and set the new one's Status accordingly
5. **Present to user** — wait for explicit approval before writing files
6. **Write** — create `docs/adr/NNNN-title.md` AND append the one-line entry to `docs/adr/README.md`

### First ADR in the Project (bootstrap)

When `docs/adr/` does not exist:

1. Create `docs/adr/` directory
2. Create `docs/adr/README.md` with header "# Architecture Decision Records" and an empty table or bullet list
3. Then proceed as normal with ADR-0001

### Reading Existing ADRs

When a user asks "why did we choose X?":

1. Search `docs/adr/*.md` for the decision
2. Present the Context, Decision, and Why sections
3. If no match, respond: "No ADR found for that decision. Would you like to record one now?"

## Decision Detection Signals

**Explicit signals** — record immediately after user approval:
- "Let's go with X"
- "We should use X instead of Y"
- "The trade-off is worth it because..."
- "Record this as an ADR"

**Implicit signals** — *suggest* recording; do not auto-create:
- Comparing two approaches and reaching a conclusion
- Choosing between auth flows, DB schema shapes, or API styles
- Deciding how a new external dependency integrates

## What Makes a Good ADR

### Do
- Be specific — "Use App Router /api routes for endpoints consumed by the extension" not "use an API"
- Record the why — the rationale matters more than the what
- Include rejected alternatives — future developers need to know what was considered
- State consequences honestly — every decision has trade-offs
- Tie to PRD FR numbers, `docs/security.md` OWASP sections, or coverage tiers when relevant
- Keep it short — readable in 2 minutes

### Don't
- Record trivial decisions — variable naming, file locations of single helpers
- Write essays — if the context exceeds ~10 lines, it is too long
- Omit alternatives — "we just picked it" is not valid rationale
- Backfill without marking it — if recording a past decision, note the original date in the body

## Integration with Other Agents

- **`architect` agent:** Primary producer of ADRs. Analyzes trade-offs and drafts ADRs as part of its `/architect` output.
- **`planner` agent:** When a proposed implementation touches system boundaries, the planner should suggest creating an ADR and defer to `/architect`.
- **`code-reviewer` agent:** Flag PRs that introduce architectural changes (new layer, new external dependency, change in auth or data flow) without a corresponding ADR.
