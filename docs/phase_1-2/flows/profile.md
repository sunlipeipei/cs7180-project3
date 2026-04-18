# Flow: Profile

**Route(s):** `/profile`
**Service(s):** `profile.service.getProfile()`, `profile.service.saveProfile()`
**Schema(s):** `MasterProfileSchema` (in `src/ai/schemas.ts`)

## User story
As a developer, I maintain one master profile as the single source of truth for every tailoring run.

## Screen states
- **Empty:** First-visit fallback renders a blank `MasterProfileSchema` skeleton (name, contact, empty experience/skills/projects arrays) with all fields editable and a disabled "Save" button until required fields are filled.
- **Populated:** Tabbed editor (Radix `Tabs`) over the stored profile from `getProfile()`. Each tab maps to one top-level schema section; "Save" is enabled once the form is dirty.
- **Loading:** Tab panels render a `surface-container-low` skeleton block matching final layout height during the initial `getProfile()` call and while `saveProfile()` is in flight (Save button shows spinner, inputs disabled).
- **Error:** On `saveProfile()` `ZodError`, surface inline field-level messages derived from `error.issues[].path`; on transport failure, a non-blocking toast with "Retry" re-invokes the last save. No partial writes.

## Phase-1 transition note
Phase 1 replaces both method bodies in `profile.service.ts` with `fetch('/api/profile')` (GET) and `fetch('/api/profile', { method: 'PUT' })`; call sites and Zod validation stay untouched.

---
## Phase 0.5 decisions

- Component primitives: Radix UI directly (@radix-ui/react-{tabs,dialog}) rather than shadcn/ui. Reason: our `@theme` tokens in `app/globals.css` use Material-3-style naming (`--color-surface-container-low` etc.) which don't map cleanly to shadcn's token conventions (`--background`, `--primary`). Radix-direct keeps our design system pristine and avoids per-component style overrides.
- Service layer: all screens consume `src/services/*.service.ts` (mock-backed by fixtures in Phase 0.5). Phase 1 swaps each service body to `fetch('/api/…')` without touching callers.
