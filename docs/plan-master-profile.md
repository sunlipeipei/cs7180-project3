# Development Plan: Master Profile Management (FR-1.6)

> This plan implements [FR-1.6](PRD_Resume_Refine_AutoFill_Tool.md) and provides the data backbone for FR-3.2 (auto-fill) and FR-3.4 (screening questions).

## Feature Scope

A TypeScript module that manages the user's "master profile" — a JSON file containing all personal info, skills, work history, education, and projects. This is the data backbone that all three phases depend on.

## Prerequisites: Project Setup

Before any TDD cycle can run, the project needs scaffolding:

- `package.json` with dependencies: `typescript`, `zod`, `vitest`, `@vitest/coverage-v8`
- `tsconfig.json` with strict mode, ESM module resolution
- `vitest.config.ts` with coverage thresholds (90% for `src/profile/`)

## Architecture

```
src/
  profile/
    index.ts              # Barrel file — public API exports
    types.ts              # MasterProfile interface + all sub-types
    schema.ts             # Zod validation schemas (infer types from schemas)
    profileManager.ts     # load / save / validate operations
    mergeProfile.ts       # Deep merge logic (complex enough for own file)
    errors.ts             # Custom error classes
    __tests__/
      fixtures/
        sample-profile.json
        invalid-profile.json
      schema.test.ts
      profileManager.test.ts
      mergeProfile.test.ts
```

**Stack:** TypeScript, Node.js, Zod (validation), Vitest (testing)

## Data Model

### MasterProfile (top-level)

| Field                | Type               | Required | Notes                                    |
| -------------------- | ------------------ | -------- | ---------------------------------------- |
| `schemaVersion`      | `number`           | Yes      | Currently `1`, for future migrations     |
| `name`               | `string`           | Yes      | Full name                                |
| `email`              | `string`           | Yes      | Validated format                         |
| `phone`              | `string`           | Yes      |                                          |
| `address`            | `Address`          | No       | Structured (FR-3.2: Workday requires it) |
| `links`              | `Links`            | No       | GitHub, LinkedIn, portfolio, etc.        |
| `summary`            | `string`           | No       | Professional summary                     |
| `skills`             | `Skill[]`          | Yes      | Structured with categories               |
| `workExperience`     | `WorkExperience[]` | Yes      | Can be empty array                       |
| `education`          | `Education[]`      | Yes      | Can be empty array                       |
| `projects`           | `Project[]`        | No       |                                          |
| `certifications`     | `Certification[]`  | No       | FR-3.2: listed alongside skills          |
| `resumeTemplatePath` | `string`           | No       | Path to .docx template (FR-1.2)          |
| `contextSources`     | `ContextSources`   | No       | GitHub repos + doc paths (FR-1.3)        |
| `preferences`        | `Preferences`      | No       | Screening question defaults (FR-3.4)     |

### Sub-types

**Address:**
`street?`, `city` (required if address present), `state?`, `zip?`, `country` (required if address present) — all strings. If `address` is provided, `city` and `country` are required (Workday minimum).

**Links:**
`github?`, `linkedin?`, `portfolio?`, `other?: Record<string, string>`

**Skill:**
`name` (required), `category?` (e.g., "language", "framework", "tool"), `level?` (e.g., "expert", "proficient")

**WorkExperience:**
`company` (required), `title` (required), `startDate` (required, ISO 8601), `endDate?` (ISO 8601 or null for current), `location?`, `descriptions: string[]` (bullet points)

**Education:**
`school` (required), `degree` (required), `fieldOfStudy?`, `startDate?`, `endDate?`, `gpa?`

**Project:**
`name` (required), `description?`, `technologies: string[]`, `url?`, `startDate?`, `endDate?`, `role?`

**Certification:**
`name` (required), `issuer?`, `date?`, `expirationDate?`, `credentialId?`

**ContextSources:**
`githubRepos: string[]`, `documentPaths: string[]`

**Preferences:**
`salaryRange?: { min: number; max: number; currency: string }`, `workAuthorization?`, `willingToRelocate?`, `yearsOfExperience?`, `careerSummary?` (for "Why do you want to work here?" answers), `targetRoles?: string[]`, `preferredIndustries?: string[]`

> **Note:** FR-3.4 screening question generation (e.g., "Why do you want to work here?", "Describe your experience with [technology]") will likely require a richer Preferences model. The `careerSummary` and `targetRoles` fields provide a starting point; further expansion is deferred to Phase 3 planning.

## Merge Strategy

Array merge uses identity-based deduplication:

| Array            | Identity Key                      | Conflict Resolution                                  |
| ---------------- | --------------------------------- | ---------------------------------------------------- |
| `workExperience` | `company` + `title` + `startDate` | Partial fields override, `descriptions` are replaced |
| `education`      | `school` + `degree`               | Partial fields override                              |
| `projects`       | `name`                            | Partial fields override                              |
| `skills`         | `name`                            | Partial fields override (category, level)            |
| `certifications` | `name` + `issuer`                 | Partial fields override                              |

- Scalar fields: partial value overwrites existing (last-write-wins)
- `undefined` in partial means "skip" (keep existing value)
- `null` in partial means "clear this field" (set to undefined)
- New array items (no identity match) are appended

## Error Types

- `ProfileValidationError` — Zod validation failures, wraps ZodError with readable messages
- `ProfileNotFoundError` — File does not exist at given path
- `ProfileIOError` — File permission errors, write failures, corrupt JSON

## TDD Plan (Red → Green → Refactor)

### Cycle 1: Define types & validate profile structure

- **RED:** Write tests that validate a correct profile passes and an incomplete one fails (missing required fields like `name`, `email`). Test nested validation (invalid work experience within valid profile). Test optional vs required field boundaries. Test email format validation, date format validation.
- **GREEN:** Implement `MasterProfile` type + Zod schema with all sub-types
- **REFACTOR:** Clean up schema, extract sub-schemas (WorkExperience, Education, Project, Skill, etc.)

### Cycle 2: Load profile from JSON file

- **RED:** Write tests for `loadProfile(path)` — valid file returns profile, missing file throws `ProfileNotFoundError`, malformed JSON throws `ProfileIOError`, valid JSON but wrong schema throws `ProfileValidationError`, empty file throws
- **GREEN:** Implement `loadProfile` with fs + Zod parse
- **REFACTOR:** Improve error messages, extract custom error classes to `errors.ts`

### Cycle 3: Save profile to JSON file

- **RED:** Write tests for `saveProfile(profile, path)` — writes valid JSON (pretty-printed), creates parent dirs if needed, validates before writing, throws `ProfileIOError` when destination path is not writable
- **GREEN:** Implement `saveProfile`
- **REFACTOR:** Extract shared file utilities

### Cycle 4: Merge/update partial profile

- **RED:** Write tests for `mergeProfile(existing, partial)` — merges scalar fields (last-write-wins), appends new array items, deduplicates by identity keys, handles null (clear) vs undefined (skip), preserves array order, replaces `descriptions` array on matched `workExperience` (not element-by-element merge)
- **GREEN:** Implement deep merge logic in `mergeProfile.ts`
- **REFACTOR:** Simplify merge, add barrel exports in `index.ts`

## Commit Plan

| #   | Message                                                        | Phase    |
| --- | -------------------------------------------------------------- | -------- |
| 0   | `chore: initialize TypeScript project with Zod and Vitest`     | SETUP    |
| 1   | `test: add failing tests for profile validation`               | RED      |
| 2   | `feat: implement MasterProfile types and Zod schema`           | GREEN    |
| 3   | `refactor: extract sub-schemas for work, education, project`   | REFACTOR |
| 4   | `test: add failing tests for loadProfile`                      | RED      |
| 5   | `feat: implement loadProfile with file reading and validation` | GREEN    |
| 6   | `refactor: improve error handling with custom error types`     | REFACTOR |
| 7   | `test: add failing tests for saveProfile`                      | RED      |
| 8   | `feat: implement saveProfile with directory creation`          | GREEN    |
| 9   | `refactor: extract shared file utilities`                      | REFACTOR |
| 10  | `test: add failing tests for mergeProfile`                     | RED      |
| 11  | `feat: implement mergeProfile with deep merge and dedup`       | GREEN    |
| 12  | `refactor: clean up merge logic, add barrel exports`           | REFACTOR |

## Acceptance Criteria

- [ ] `MasterProfile` type covers all fields in the Data Model section above
- [ ] All sub-types (WorkExperience, Education, Project, Skill, Certification, etc.) fully specified
- [ ] All invalid profiles are rejected with clear, typed error messages
- [ ] Profile round-trips (load → save → load) without data loss
- [ ] Partial updates merge correctly using identity-based deduplication
- [ ] `null` clears fields, `undefined` skips fields in merges
- [ ] Custom error classes provide actionable error information
- [ ] `src/profile/index.ts` exports clean public API usable by Phase 1 tailoring engine (types, schemas, load/save/merge functions)
- [ ] Public API includes typed accessors so downstream consumers can retrieve structured context (work history, skills, projects) without coupling to internal schema details
- [ ] ≥ 90% test coverage on profile module
