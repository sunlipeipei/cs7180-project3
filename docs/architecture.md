# Architecture

## System Overview

BypassHire is a Next.js full-stack application that reduces job application time from 30–60 minutes to under 5 minutes through AI-powered resume tailoring and form auto-fill.

## 3-Phase Architecture

```
User
 │
 ├─── Phase 1: Resume Tailoring Engine
 │     ├── Job Description Intake (paste or URL)
 │     ├── Resume Template Upload (.docx)
 │     ├── Context Extraction (GitHub API via MCP + project docs)
 │     ├── Claude API → tailored resume content
 │     └── .docx output
 │
 ├─── Phase 2: Interactive Editing Interface
 │     ├── Web-based resume viewer
 │     ├── Inline comments on selected text
 │     ├── Claude API → targeted section revisions
 │     ├── Diff view + accept/reject changes
 │     └── Version history
 │
 └─── Phase 3: Auto-Fill Application Forms
       ├── Browser extension / MCP integration
       ├── Workday portal detection + field mapping
       ├── Screening question generation (Claude API)
       └── User review before submit (NO auto-submit)
```

## Tech Stack

| Layer      | Technology                 | Rationale                                          |
| ---------- | -------------------------- | -------------------------------------------------- |
| Framework  | Next.js 15 (App Router)    | Full-stack, Vercel-native, RSC support             |
| Database   | PostgreSQL via Neon        | Serverless-friendly, free tier, Vercel integration |
| ORM        | Prisma 7 (driver adapters) | Type-safe queries, migration history               |
| Auth       | Clerk                      | Managed auth, Next.js middleware integration       |
| AI         | Anthropic Claude API       | Core intelligence for tailoring and Q&A            |
| Validation | Zod                        | Runtime schema validation for all API boundaries   |
| Testing    | Vitest + Playwright        | Fast unit/integration + E2E                        |
| Deployment | Vercel                     | Preview deploys, env var management                |
| CI/CD      | GitHub Actions             | Lint, typecheck, tests, security, deploy           |

## Data Model

```
User (Clerk ID + email)
 ├── Profile (MasterProfile JSON — see src/profile/types.ts)
 ├── JobDescription (JD text, title, company, sourceUrl)
 └── Resume (tailored content JSON, .docx path, linked JD)
```

## Key Directories

```
app/               Next.js App Router pages and API routes
src/
  profile/         Master profile data model, validation, merge logic
  lib/             Prisma singleton, DB adapters
  generated/       Prisma client (do not edit)
  test/            Shared test setup (dotenv loader)
prisma/            Schema and migrations
docs/              Architecture, testing strategy, security, PRD
.claude/           Claude Code workflow (commands, agents, skills)
```

## Implementation Status

| Phase      | Feature                       | Status         |
| ---------- | ----------------------------- | -------------- |
| Foundation | Next.js + Prisma + Neon setup | Done (PR #33)  |
| Foundation | Authentication (Clerk)        | Issue #18      |
| Phase 1    | Job Description Intake        | Issue #5       |
| Phase 1    | Resume Template Upload        | Issue #6       |
| Phase 1    | GitHub Context Extraction     | Issue #7       |
| Phase 1    | Resume Tailoring Engine       | Issue #8       |
| Phase 2    | Interactive Editing UI        | Issues #9–#13  |
| Phase 3    | Auto-Fill Browser Extension   | Issues #14–#16 |
