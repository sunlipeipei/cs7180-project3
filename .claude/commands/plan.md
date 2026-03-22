---
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
---

# Plan Command

This command invokes the **planner** agent to create a comprehensive implementation plan before writing any code.

## What This Command Does

1. **Restate Requirements** - Clarify what needs to be built
2. **Identify Risks** - Surface potential issues and blockers
3. **Create Step Plan** - Break down implementation into phases
4. **Wait for Confirmation** - MUST receive user approval before proceeding

## When to Use

Use `/plan` when:
- Starting a new feature
- Making significant architectural changes
- Working on complex refactoring
- Multiple files/components will be affected
- Requirements are unclear or ambiguous

## How It Works

The planner agent will:

1. **Analyze the request** and restate requirements in clear terms
2. **Break down into phases** with specific, actionable steps
3. **Identify dependencies** between components
4. **Assess risks** and potential blockers
5. **Estimate complexity** (High/Medium/Low)
6. **Present the plan** and WAIT for your explicit confirmation

## Example Usage

```
User: /plan I need to build the context extraction service that pulls data from GitHub repos

Agent (planner):
# Implementation Plan: Context Extraction Service

## Requirements Restatement
- Extract project context from user-specified GitHub repositories
- Parse README files, commit history, and repo metadata (languages, technologies)
- Extract details from project documents (PRDs, design docs in .docx/Markdown/PDF)
- Structure extracted data for use by the resume tailoring engine (FR-1.3)

## Implementation Phases

### Phase 1: GitHub Context Extractor
- Create GitHubExtractor service in lib/context/github.ts
- Use GitHub API to fetch repo metadata (languages, topics, description)
- Parse README.md content for project summaries
- Summarize recent commit history (technologies touched, contribution areas)
- Handle rate limiting and authentication (personal access token)

### Phase 2: Document Parser
- Create DocumentParser service in lib/context/documents.ts
- Parse .docx files using `docx` library to extract text content
- Parse Markdown files for structured sections (responsibilities, outcomes)
- Extract key facts: technologies, metrics, accomplishments, team size

### Phase 3: Context Aggregator
- Create ContextAggregator in lib/context/aggregator.ts
- Merge GitHub and document contexts into a unified profile
- Deduplicate skills and technologies across sources
- Rank experiences by relevance to a given job description
- Output structured JSON for the resume tailoring prompt

### Phase 4: Integration with Tailoring Engine
- Wire context aggregator output into the Claude API prompt
- Add context source selection UI (pick repos + documents)
- Cache extracted context locally to avoid repeated API calls

## Dependencies
- GitHub API (via Octokit or fetch)
- Document parsing: `docx` (Node.js) for .docx files
- Anthropic Claude API for summarization of large contexts
- Local filesystem for caching

## Risks
- HIGH: GitHub API rate limits (60 req/hr unauthenticated, 5000 with token)
- MEDIUM: Large repos may exceed context window for summarization
- MEDIUM: Inconsistent document formats (PRDs vary widely in structure)
- LOW: Private repo access requires OAuth or PAT setup

## Estimated Complexity: MEDIUM
- GitHub extractor: 4-5 hours
- Document parser: 3-4 hours
- Aggregator + integration: 3-4 hours
- Testing: 3-4 hours
- Total: 13-17 hours

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)
```

## Important Notes

**CRITICAL**: The planner agent will **NOT** write any code until you explicitly confirm the plan with "yes" or "proceed" or similar affirmative response.

If you want changes, respond with:
- "modify: [your changes]"
- "different approach: [alternative]"
- "skip phase 2 and do phase 3 first"

## Integration with Other Commands

After planning:
- Use `/tdd` to implement with test-driven development
- Use `/build-fix` if build errors occur
- Use `/code-review` to review completed implementation

