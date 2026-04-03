# Testing Strategy

## Core Rule: TDD is Mandatory

All tests must be written **before** implementation. The git history must show failing tests committed before the code that makes them pass.

```
RED   → Write a failing test
GREEN → Write the minimum code to pass it
REFACTOR → Clean up without breaking tests
```

## Coverage Thresholds

| Scope                       | Threshold                                    |
| --------------------------- | -------------------------------------------- |
| Overall project             | 70% minimum                                  |
| `src/profile/`              | 90% (statements, branches, functions, lines) |
| Auth middleware, API routes | 100% (critical paths)                        |
| DB adapter (`src/lib/`)     | 80% minimum                                  |

## Test Pyramid

```
        /\
       /E2E\         Playwright — critical user journeys
      /------\
     /  Integ \      Vitest + real Neon DB — DB constraints, API routes
    /----------\
   /    Unit    \    Vitest + mocked deps — pure logic, schemas, utilities
  /______________\
```

### Unit Tests (`src/**/__tests__/`)

- Mock all external dependencies (Prisma, Claude API, filesystem)
- Fast — must run in under 1 second per file
- Cover: validation logic, merge logic, error classes, utility functions
- Command: `npm test`

### Integration Tests (`src/lib/__tests__/schema.integration.test.ts`)

- Hit the real Neon database (requires `DATABASE_URL` in `.env`)
- Verify: DB constraints, cascade deletes, FK relationships
- Isolated: use unique run IDs per test run; clean up in `afterEach`
- Command: `npm test` (same runner, dotenv loaded via `src/test/setup.ts`)

### E2E Tests (`e2e/` — to be created in Issue #26)

- Use Playwright against the running Next.js app
- Cover the critical path: sign in → paste JD → generate resume → download
- Run in CI with Vercel preview URL
- Command: `npx playwright test`

## Definition of Done

A feature is done when ALL of the following are true:

- [ ] Tests written before implementation (visible in git)
- [ ] All existing tests still pass
- [ ] New feature has unit + integration tests
- [ ] Coverage thresholds met for changed files
- [ ] `npm run build` passes with zero type errors
- [ ] `npm run lint` passes with zero errors
- [ ] Security acceptance criteria met (see `docs/security.md`)
- [ ] PR opened with C.L.E.A.R. review + AI disclosure

## Running Tests

```bash
npm test                        # all tests (unit + integration)
npm run test:coverage           # with coverage report
npx playwright test             # E2E (requires dev server running)
npx vitest run src/lib/         # specific directory
```
