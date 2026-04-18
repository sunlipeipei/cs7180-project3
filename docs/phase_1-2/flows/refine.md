# Flow: Refine

**Invoked from:** `/tailor/[resumeId]` (Refine dialog — Radix `Dialog`)
**Service(s):** `resume.service.refineSection()`
**Schema(s):** `RefineRequestSchema`, `RefineResponseSchema` (in `src/ai/schemas.ts`)

## User story
As a developer, I issue a natural-language instruction to rewrite exactly one section of my tailored resume without disturbing the others.

## Screen states
- **Empty:** Dialog opens pre-populated with the target `ResumeSection` (header/summary/skills/experience/education/projects) and an empty 1000-char `instruction` textarea; submit is disabled until the field is non-empty.
- **Populated:** Textarea holds the user's instruction; "Apply" button becomes primary-gradient-active. On success, the dialog closes and the parent `/tailor` page swaps in `RefineResponseSchema.updatedMarkdown` for that section.
- **Loading:** On submit, the textarea and section selector lock; the Apply button inlines the glowing "Tailor" progress bar and the AI-signature glassmorphism wash overlays the dialog body.
- **Error:** ZodError (empty/>1000 chars) shows inline helper text under the textarea; "Resume not found" or transport failure renders a dismissable error card inside the dialog; the section on the parent page is never mutated on failure.

## Phase-1 transition note
Phase 1 swaps the `refineSection()` body to `fetch('/api/resumes/[resumeId]/refine', { method: 'POST' })` returning `RefineResponseSchema`; the dialog component and validation stay identical.
