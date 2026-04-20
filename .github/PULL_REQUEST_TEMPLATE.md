## Summary

<!--
1-3 bullets: what changes and why.
-->

-
-

## Linked issue

Closes #

---

## C.L.E.A.R. self-review

| Dimension      | Criterion                                                          | Status | Author note |
| -------------- | ------------------------------------------------------------------ | ------ | ----------- |
| **C**oncise    | PR is focused on one concern                                       | - [ ]  |             |
| **L**inked     | Ties back to a GitHub issue or spec section                        | - [ ]  |             |
| **E**xplicit   | All acceptance criteria from the issue are checked off below       | - [ ]  |             |
| **A**ctionable | Reviewer comment in the PR description says where to start reading | - [ ]  |             |
| **R**eviewable | Diff is under ~400 lines; if larger, explain why                   | - [ ]  |             |

---

## AI disclosure

- % AI-generated (code): \_\_\_
- Primary tool / model: e.g., Claude Code (Sonnet 4.6)
- Human review applied: - [ ] yes — describe what was reviewed and by whom
- AI-generated copy in user-facing strings: - [ ] yes / no (if yes, list which strings)

---

## Test plan

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm test` — unit + integration
- [ ] `npm run test:integration` against Neon test branch (if touching DB)
- [ ] `npx playwright test` E2E smoke (if UI-facing)
- [ ] Manual UAT steps:
  1.
  2.

---

## Security DoD

- [ ] No secrets or API keys committed (`.env` not staged)
- [ ] All user input validated with Zod before DB or AI use
- [ ] DB queries scoped to authenticated `userId` from session
- [ ] No `dangerouslySetInnerHTML` with user-controlled content
- [ ] No raw SQL with string interpolation
- [ ] GitHub/external URLs validated before fetch
- [ ] `npm audit` passes with no high/critical issues
- [ ] No prompt-injection vector: JD/resume content wrapped in `<data>...</data>` delimiters in prompts
- [ ] Gitleaks pre-commit clean (applicable once issue #25 lands)

---

## Screenshots / recordings

<!-- Optional. Attach for any UI-facing change. -->

---

## Deployment notes

<!-- Migration required? New env var? Feature flag? Leave blank if none. -->
