# Flow: Dashboard

**Route(s):** `/dashboard`, `/dashboard/new`
**Service(s):** `profile.service.getProfile()`, `jobDescription.service.listJobDescriptions()`, `jobDescription.service.createJD()`, `resume.service.listResumes()`
**Schema(s):** `IngestJDRequestSchema`, `IngestJDResponseSchema`, `MasterProfileSchema` (read-only), `TailoredResumeSchema` (read-only) (in `src/ai/schemas.ts`)

## User story
As a developer, I see every JD I've saved and every resume I've tailored, and I can kick off a new run from one place.

## Screen states
- **Empty:** `/dashboard` with zero JDs and zero resumes shows a centered "Paste your first JD" CTA linking to `/dashboard/new`; the sidebar profile badge still renders from `getProfile()`.
- **Populated:** `/dashboard` runs `listJobDescriptions()` and `listResumes()` in parallel; JDs render as a tonal-alternating list (title/company/parsedAt), resumes render grouped under their `jobDescriptionId`. `/dashboard/new` shows an `IngestJDRequestSchema` form (source: url | paste, content textarea) that calls `createJD()` and navigates to `/tailor/[newResumeId]`.
- **Loading:** Both lists render skeleton rows sized to the real row height; `/dashboard/new` disables the submit button and shows the "Tailor" progress bar during `createJD()`.
- **Error:** List fetch failure renders an inline retry card per pane (JDs vs resumes fail independently). `createJD()` Zod or transport failure keeps the user on `/dashboard/new` with an inline error under the content textarea; no JD is created on failure.

## Phase-1 transition note
Phase 1 swaps the service bodies to `GET /api/job-descriptions`, `POST /api/job-descriptions`, `GET /api/resumes`, `GET /api/profile`; pagination and auth scoping land here without UI changes.
