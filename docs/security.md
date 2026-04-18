# Security

## OWASP Top 10 — BypassHire Notes

### A01: Broken Access Control

**Risk:** Users accessing other users' profiles, resumes, or job descriptions.

- All DB queries **must** scope to `userId` obtained from the Clerk session — never from request body or URL params
- `profileRepository.ts` enforces this: `getProfile(userId)` and `saveProfile(userId, ...)` take the server-side userId only
- API routes must call `auth()` from Clerk before any DB operation
- Test: integration tests verify FK constraints prevent cross-user data access

### A02: Cryptographic Failures (Sensitive Data Exposure)

**Risk:** Leaking API keys, database credentials, or user PII.

- `DATABASE_URL`, `CLERK_SECRET_KEY`, `ANTHROPIC_API_KEY` must **never** be committed
- `.env` is in `.gitignore`; use `.env.example` with placeholder values
- Gitleaks pre-commit hook will be added in Issue #25 (S2-2) to block accidental commits
- Never log full request bodies that may contain resume content (PII)
- Neon connection requires `sslmode=require` — enforced in `DATABASE_URL`

### A03: Injection

**Risk:** SQL injection via user input; prompt injection via job description content.

- **SQL injection:** Prisma uses parameterized queries exclusively — no raw SQL with user input
- **Prompt injection:** Job description content inserted into Claude API prompts must be wrapped in clear delimiters (e.g., `<job_description>...</job_description>`) and Claude instructed to treat it as data, not instructions
- Zod validates all API input before it reaches the DB or Claude API

### A04: Insecure Design

**Risk:** Auto-submitting job applications without user consent.

- Phase 3 (auto-fill) **must never auto-submit** — FR-3.5 requires explicit user review and confirmation before any form submission
- This is a hard product requirement enforced at the design level

### A05: Security Misconfiguration

**Risk:** Exposed dev endpoints, default credentials, misconfigured CORS.

- No default credentials anywhere — Clerk manages all auth
- Next.js API routes are server-only by default (no accidental client exposure)
- Environment variables managed via Vercel dashboard — never hardcoded
- `npm audit` runs in CI on every PR to catch misconfigured dependencies

### A06: Vulnerable and Outdated Components

**Risk:** Dependencies with known CVEs.

- `npm audit` is a required CI stage (Issue #22 / S2-1)
- Address high/critical vulnerabilities before merge; moderate on a case-by-case basis
- Keep `next`, `@prisma/client`, `zod`, and `@anthropic-ai/sdk` on latest stable

### A07: Identification and Authentication Failures

**Risk:** Broken login, session fixation, missing auth checks.

- Clerk handles all authentication — do not implement custom auth
- Next.js middleware enforces auth on all `/dashboard` and `/api` routes
- Never trust `userId` from client — always use `auth()` server-side
- API routes must import `getAuth` / `getCurrentUser` from `src/lib/auth` — never directly from `@clerk/nextjs/server`. ESLint enforces this.
- Session tokens managed by Clerk (HttpOnly cookies, short-lived JWTs)

### A08: Software and Data Integrity Failures

**Risk:** Corrupted profile data stored in DB, untrusted JSON.

- All JSON read from the DB is re-validated with `MasterProfileSchema.safeParse()` before use (see `profileRepository.ts:14`)
- `ProfileValidationError` thrown on invalid stored data — never silently pass corrupt data to the UI
- CI pipeline verifies `npm run build` and `tsc --noEmit` on every PR

### A09: Security Logging and Monitoring Failures

**Risk:** Unable to detect attacks or debug incidents.

- Log auth events (sign-in, sign-out, auth failures) — Clerk provides audit logs
- Log Claude API calls (model, tokens used) — not the full prompt/response
- Never log: passwords, API keys, full resume content, PII fields
- Sentry will be configured in Sprint 2 for error tracking

### A10: Server-Side Request Forgery (SSRF)

**Risk:** Attacker-controlled URLs passed to GitHub context extraction.

- FR-1.3 (GitHub context extraction) accepts repo URLs from users
- All GitHub API calls must go through the GitHub MCP server — no direct `fetch(userUrl)`
- Validate GitHub repo URLs against an allowlist pattern: `^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$`

---

## Security Acceptance Criteria (Definition of Done)

Every PR must confirm:

- [ ] No secrets or API keys committed (`.env` not staged)
- [ ] All user input validated with Zod before DB or AI use
- [ ] DB queries scoped to authenticated `userId` from session
- [ ] No `dangerouslySetInnerHTML` with user-controlled content
- [ ] No raw SQL with string interpolation
- [ ] GitHub/external URLs validated before fetch
- [ ] `npm audit` passes with no high/critical issues

---

## Future Security Gates (Issue #25 — S2-2)

- Pre-commit: Gitleaks secrets detection
- CI: Automated security sub-agent PR review
- CI: SAST scan
