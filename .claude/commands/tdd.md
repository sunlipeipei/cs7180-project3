---
description: Enforce test-driven development workflow. Scaffold interfaces, generate tests FIRST, then implement minimal code to pass. Ensure 80%+ coverage.
---

# TDD Command

This command invokes the **tdd-guide** agent to enforce test-driven development methodology.

## What This Command Does

1. **Scaffold Interfaces** - Define types/interfaces first
2. **Generate Tests First** - Write failing tests (RED)
3. **Implement Minimal Code** - Write just enough to pass (GREEN)
4. **Refactor** - Improve code while keeping tests green (REFACTOR)
5. **Verify Coverage** - Ensure 80%+ test coverage

## When to Use

Use `/tdd` when:
- Implementing new features
- Adding new functions/components
- Fixing bugs (write test that reproduces bug first)
- Refactoring existing code
- Building critical business logic

## How It Works

The tdd-guide agent will:

1. **Define interfaces** for inputs/outputs
2. **Write tests that will FAIL** (because code doesn't exist yet)
3. **Run tests** and verify they fail for the right reason
4. **Write minimal implementation** to make tests pass
5. **Run tests** and verify they pass
6. **Refactor** code while keeping tests green
7. **Check coverage** and add more tests if below 80%

## TDD Cycle

```
RED → GREEN → REFACTOR → REPEAT

RED:      Write a failing test
GREEN:    Write minimal code to pass
REFACTOR: Improve code, keep tests passing
REPEAT:   Next feature/scenario
```

## Example Usage

```
User: /tdd I need a function to match resume sections to job description requirements

Agent (tdd-guide):
# TDD Session: Resume Section Matcher

## Step 1: Define Interface (SCAFFOLD)

```typescript
// lib/resume/section-matcher.ts
export interface JobRequirement {
  skill: string
  category: 'technical' | 'leadership' | 'domain'
  priority: 'required' | 'preferred'
}

export interface ResumeSection {
  title: string
  content: string
  skills: string[]
}

export interface MatchResult {
  section: ResumeSection
  matchedRequirements: JobRequirement[]
  relevanceScore: number // 0-100
}

export function matchSectionsToRequirements(
  sections: ResumeSection[],
  requirements: JobRequirement[]
): MatchResult[] {
  // TODO: Implementation
  throw new Error('Not implemented')
}
```

## Step 2: Write Failing Test (RED)

```typescript
// lib/resume/section-matcher.test.ts
import { matchSectionsToRequirements } from './section-matcher'

describe('matchSectionsToRequirements', () => {
  it('should score highly when section skills match required requirements', () => {
    const sections = [{
      title: 'Backend Development',
      content: 'Built microservices handling 10K req/s',
      skills: ['Node.js', 'TypeScript', 'PostgreSQL']
    }]
    const requirements = [
      { skill: 'Node.js', category: 'technical' as const, priority: 'required' as const },
      { skill: 'TypeScript', category: 'technical' as const, priority: 'required' as const }
    ]

    const results = matchSectionsToRequirements(sections, requirements)

    expect(results[0].relevanceScore).toBeGreaterThan(70)
    expect(results[0].matchedRequirements).toHaveLength(2)
  })

  it('should score low when section has no matching skills', () => {
    const sections = [{
      title: 'Graphic Design',
      content: 'Created marketing materials',
      skills: ['Figma', 'Photoshop']
    }]
    const requirements = [
      { skill: 'Python', category: 'technical' as const, priority: 'required' as const }
    ]

    const results = matchSectionsToRequirements(sections, requirements)

    expect(results[0].relevanceScore).toBeLessThan(20)
    expect(results[0].matchedRequirements).toHaveLength(0)
  })

  it('should handle empty sections array', () => {
    const results = matchSectionsToRequirements([], [
      { skill: 'React', category: 'technical' as const, priority: 'required' as const }
    ])

    expect(results).toEqual([])
  })
})
```

## Step 3: Run Tests - Verify FAIL

```bash
npm test lib/resume/section-matcher.test.ts

FAIL lib/resume/section-matcher.test.ts
  ✕ should score highly when section skills match required requirements (2 ms)
    Error: Not implemented

1 test failed, 0 passed
```

✅ Tests fail as expected. Ready to implement.

## Step 4: Implement Minimal Code (GREEN)

```typescript
// lib/resume/section-matcher.ts
export function matchSectionsToRequirements(
  sections: ResumeSection[],
  requirements: JobRequirement[]
): MatchResult[] {
  if (sections.length === 0) return []

  return sections.map(section => {
    const matched = requirements.filter(req =>
      section.skills.some(skill =>
        skill.toLowerCase() === req.skill.toLowerCase()
      )
    )

    const requiredCount = requirements.filter(r => r.priority === 'required').length
    const matchedRequired = matched.filter(r => r.priority === 'required').length

    const relevanceScore = requiredCount > 0
      ? Math.round((matchedRequired / requiredCount) * 100)
      : 0

    return { section, matchedRequirements: matched, relevanceScore }
  })
}
```

## Step 5: Run Tests - Verify PASS

```bash
npm test lib/resume/section-matcher.test.ts

PASS lib/resume/section-matcher.test.ts
  ✓ should score highly when section skills match required requirements (3 ms)
  ✓ should score low when section has no matching skills (2 ms)
  ✓ should handle empty sections array (1 ms)

3 tests passed
```

✅ All tests passing!

## Step 6: Refactor (IMPROVE)

```typescript
// lib/resume/section-matcher.ts - Refactored for clarity
const PRIORITY_WEIGHTS = {
  required: 1.0,
  preferred: 0.5,
} as const

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim()
}

function calculateRelevance(
  matched: JobRequirement[],
  allRequirements: JobRequirement[]
): number {
  if (allRequirements.length === 0) return 0

  const weightedMatched = matched.reduce((sum, r) => sum + PRIORITY_WEIGHTS[r.priority], 0)
  const weightedTotal = allRequirements.reduce((sum, r) => sum + PRIORITY_WEIGHTS[r.priority], 0)

  return Math.round((weightedMatched / weightedTotal) * 100)
}

export function matchSectionsToRequirements(
  sections: ResumeSection[],
  requirements: JobRequirement[]
): MatchResult[] {
  if (sections.length === 0) return []

  const normalizedReqs = requirements.map(r => ({
    ...r,
    normalizedSkill: normalizeSkill(r.skill)
  }))

  return sections.map(section => {
    const sectionSkills = new Set(section.skills.map(normalizeSkill))
    const matched = normalizedReqs
      .filter(req => sectionSkills.has(req.normalizedSkill))
      .map(({ normalizedSkill, ...req }) => req)

    return {
      section,
      matchedRequirements: matched,
      relevanceScore: calculateRelevance(matched, requirements),
    }
  })
}
```

## Step 7: Verify Tests Still Pass

```bash
npm test lib/resume/section-matcher.test.ts

PASS lib/resume/section-matcher.test.ts
  ✓ should score highly when section skills match required requirements (3 ms)
  ✓ should score low when section has no matching skills (2 ms)
  ✓ should handle empty sections array (1 ms)

3 tests passed
```

✅ Refactoring complete, tests still passing!

## Step 8: Check Coverage

```bash
npm test -- --coverage lib/resume/section-matcher.test.ts

File                 | % Stmts | % Branch | % Funcs | % Lines
---------------------|---------|----------|---------|--------
section-matcher.ts   |   100   |   100    |   100   |   100

Coverage: 100% ✅ (Target: 80%)
```

✅ TDD session complete!
```

## TDD Best Practices

**DO:**
- ✅ Write the test FIRST, before any implementation
- ✅ Run tests and verify they FAIL before implementing
- ✅ Write minimal code to make tests pass
- ✅ Refactor only after tests are green
- ✅ Add edge cases and error scenarios
- ✅ Aim for 80%+ coverage (100% for critical code)

**DON'T:**
- ❌ Write implementation before tests
- ❌ Skip running tests after each change
- ❌ Write too much code at once
- ❌ Ignore failing tests
- ❌ Test implementation details (test behavior)
- ❌ Mock everything (prefer integration tests)

## Test Types to Include

**Unit Tests** (Function-level):
- Happy path scenarios
- Edge cases (empty, null, max values)
- Error conditions
- Boundary values

**Integration Tests** (Component-level):
- API endpoints
- Database operations
- External service calls
- React components with hooks

**E2E Tests** (use `/e2e` command):
- Critical user flows
- Multi-step processes
- Full stack integration

## Coverage Requirements

- **80% minimum** for all code
- **100% required** for:
  - Resume generation and tailoring logic
  - Context extraction (GitHub, document parsing)
  - Form auto-fill field mapping
  - Security-critical code (API key handling, user data)

## Important Notes

**MANDATORY**: Tests must be written BEFORE implementation. The TDD cycle is:

1. **RED** - Write failing test
2. **GREEN** - Implement to pass
3. **REFACTOR** - Improve code

Never skip the RED phase. Never write code before tests.

## Integration with Other Commands

- Use `/plan` first to understand what to build
- Use `/tdd` to implement with tests
- Use `/build-fix` if build errors occur
- Use `/code-review` to review implementation
- Use `/test-coverage` to verify coverage

## Related Agents

This command invokes the `tdd-guide` agent provided by ECC.

The related `tdd-workflow` skill is also bundled with ECC.

For manual installs, the source files live at:
- `agents/tdd-guide.md`
- `skills/tdd-workflow/SKILL.md`
