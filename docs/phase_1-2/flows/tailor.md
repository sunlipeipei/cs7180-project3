# Flow: Tailor

**Route(s):** `/tailor/[resumeId]`
**Service(s):** `resume.service.getResume()`, `resume.service.tailorResume()`, `resume.service.refineSection()`, `jobDescription.service.getJobDescription()`
**Schema(s):** `TailoredResumeSchema`, `TailorRequestSchema`, `TailorResponseSchema` (in `src/ai/schemas.ts`)

## User story
As a developer, I review a JD-tailored resume and iterate on it one section at a time until it reads right.

## Screen states
- **Empty:** If `getResume(resumeId)` returns `null`, render a "Resume not found" panel with a link back to `/dashboard`; no sections rendered.
- **Populated:** Two-pane layout — left pane shows the JD header from `getJobDescription(jobDescriptionId)` (title, company, parsedAt); right pane renders the six `TailoredResumeSchema` sections (header, summary, skills, experience, education, projects) as stacked markdown blocks, each with a "Refine" action that opens the Refine dialog.
- **Loading:** During initial parallel load of resume + JD, each pane shows tonal skeleton blocks; during `tailorResume()` or `refineSection()` the affected section shows the glowing-secondary "Tailor" progress bar from the design system while other sections stay interactive.
- **Error:** Resume load error swaps the right pane for a retry card; `refineSection()` failure leaves the prior section markdown intact and surfaces a toast with the Zod or transport message.

## Phase-1 transition note
Phase 1 replaces `resume.service.*` bodies with `fetch('/api/resumes/[id]')`, `POST /api/resumes/tailor`, `POST /api/resumes/[id]/refine`; JD lookup becomes `GET /api/job-descriptions/[id]`.
