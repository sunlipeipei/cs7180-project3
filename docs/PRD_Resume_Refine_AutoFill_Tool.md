# PRD: BypassHire (Resume Refine & Auto-Fill Tool)

**Version:** V1.0 (MVP)
**Date:** 2026-03-21
**Authors:** sunlipeipei, iDako7
**Status:** Draft

---

## 1. Introduction / Overview

Job seekers in the software engineering field often need to apply to 5–10 positions per day. Ideally, each application would include a tailored resume, but manually customizing a resume for every job description is extremely time-consuming. On top of that, most job portals (especially Workday-based systems) require applicants to repeatedly fill in the same information across lengthy forms.

This tool solves both problems by combining AI-powered resume tailoring with interactive editing and automated application form filling. It leverages the user's existing codebase, project documents, and past resumes to generate targeted, high-quality resumes — and then helps submit applications faster through browser automation.

---

## 2. Goals

1. **Reduce resume tailoring time** from 30–60 minutes per application to under 5 minutes.
2. **Maintain resume quality and personal style** while adapting content to match specific job descriptions.
3. **Enable iterative, human-in-the-loop editing** so users retain full control over the final output.
4. **Automate repetitive form filling** on job application portals to save 10–20 minutes per application.
5. **Extract real project data** from codebases and documents to ensure resume content is factual and concrete.

---

## 3. User Stories

- **US-1:** As a software engineer, I want to paste a job description and have the tool automatically tailor my resume to highlight relevant skills and experience, so that I can apply faster without sacrificing quality.
- **US-2:** As a user, I want the tool to pull concrete facts (technologies used, project scope, outcomes) from my codebase and project documents, so that my resume reflects real accomplishments rather than vague descriptions.
- **US-3:** As a user, I want to provide my existing resume as a style template, so that the generated resume matches my personal formatting and writing style.
- **US-4:** As a user, I want to highlight a section of my resume and leave a comment (e.g., "too verbose" or "emphasize leadership"), so that the AI can revise that specific section based on my feedback.
- **US-5:** As a user, I want to go back and forth with the AI multiple times to refine my resume, so that I end up with a polished final version.
- **US-6:** As a user, I want the tool to auto-fill job application forms on Workday and similar portals, so that I don't have to manually re-enter my information for every application.
- **US-7:** As a user, I want the tool to generate answers to common screening questions (e.g., "Why do you want to work here?") based on my background and the job description, so that I can review and submit them quickly.

---

## 4. Functional Requirements

### Phase 1: AI-Powered Resume Tailoring Engine

**FR-1.1:** The system must accept a job description as input (pasted text or URL).

**FR-1.2:** The system must accept a user's existing resume as a style template. Supported input format: Word (.docx).

**FR-1.3:** The system must retrieve and parse context from user-specified sources:

- Code repositories (e.g., GitHub repos) — extract project names, technologies, README content, and commit history summaries.
- Project documents (e.g., PRDs, design docs, meeting notes) — extract responsibilities, accomplishments, and technical details.

**FR-1.4:** The system must generate a tailored resume that:

- Highlights skills and experiences relevant to the target job description.
- Uses concrete, quantifiable facts drawn from the retrieved context (not generic filler).
- Preserves the formatting style, tone, and structure of the user's template resume.

**FR-1.5:** The system must output the tailored resume in Word (.docx) format.

**FR-1.6:** The system must support a "master profile" — a comprehensive document containing all of the user's experiences, skills, and projects — which serves as the primary data source for tailoring.

### Phase 2: Interactive Editing Interface

**FR-2.1:** The system must provide a web-based editing interface where users can view and edit their generated resume.

**FR-2.2:** The system must allow users to select a specific section or line of text and attach a comment or instruction (e.g., "make this more concise," "add metrics," "remove this bullet").

**FR-2.3:** The AI must process inline comments and revise only the targeted section, leaving the rest of the document unchanged.

**FR-2.4:** The system must support multiple rounds of revision. Users can continue providing feedback and the AI will iteratively improve the document.

**FR-2.5:** The system must display a diff view or change highlights so users can see what the AI modified after each revision round.

**FR-2.6:** The system must allow users to accept, reject, or further modify each AI-suggested change.

**FR-2.7:** The system must maintain a version history so users can revert to any previous version.

### Phase 3: Auto-Fill Application Forms

**FR-3.1:** The system must integrate with web browsers (via a browser extension or MCP-based automation) to interact with job application portals.

**FR-3.2:** The system must auto-detect and fill standard form fields on supported platforms, including:

- Personal information (name, email, phone, address)
- Work history (company, title, dates, descriptions)
- Education (school, degree, dates)
- Skills and certifications
- Upload resume file

**FR-3.3:** The system must support Workday-based portals as the primary target. Support for other form-heavy portals (e.g., Taleo, iCIMS, custom ATS) is a secondary goal.

**FR-3.4:** The system must generate draft answers to common screening questions based on the user's profile and the specific job description. Examples include:

- "Why do you want to work here?"
- "Describe your experience with [technology]."
- "What is your expected salary range?"

**FR-3.5:** The system must present all auto-filled content and generated answers for user review before final submission. The system must NOT submit any application without explicit user confirmation.

**FR-3.6:** The system must allow users to edit any auto-filled field or generated answer before submission.

---

## 5. Non-Goals (Out of Scope)

- **Resume design / visual layout tools:** The tool will not provide drag-and-drop design capabilities. It focuses on content, not graphic design.
- **Cover letter generation:** Not included in V1, though the architecture should not prevent adding it later.
- **Support for non-tech job applications:** The tool is optimized for software engineering roles. General-purpose job seeking is out of scope.
- **Full ATS (Applicant Tracking System) integration via API:** Auto-fill works through browser automation, not direct ATS API integration.
- **Job search / job discovery:** The tool does not find jobs for the user; it helps after the user has identified a job to apply for.
- **Multi-language resume support:** V1 supports English-language resumes only.
- **Mobile interface:** V1 is desktop/web only.

---

## 6. Design Considerations

### Editing Interface (Phase 2)

- **Recommended approach:** A web application with a split-pane layout — the resume document on the left, and an AI chat / comment panel on the right.
- The editing experience should feel similar to Google Docs with comments, but with an AI agent that responds to comments and applies edits.
- Use a rich text editor component (e.g., Tiptap, ProseMirror, or Slate) for the document editing area.
- Show AI changes with inline highlights (green for additions, red with strikethrough for deletions).

### Auto-Fill Interface (Phase 3)

- The browser extension should show a floating sidebar or popup overlay on the application portal page.
- All auto-filled fields should be visually highlighted so the user can quickly scan and approve.

### General

- Clean, minimal UI. The tool should feel professional, not cluttered.
- Consistent with modern developer tool aesthetics (dark/light mode support preferred).

---

## 7. Technical Considerations

### Phase 1 — Resume Tailoring Engine

- **AI Backend:** Use the Anthropic Claude API (or Claude Code CLI) for resume generation and tailoring.
- **Context Retrieval:**
  - GitHub API or local git commands to extract repo metadata, README files, and commit summaries.
  - File system access or document parsing (Markdown, .docx, PDF) for project documents and PRDs.
- **Document Generation:** Use a library like `docx` (Node.js) or `python-docx` (Python) to generate .docx output that matches the user's template style.
- **Template Matching:** Parse the user's existing resume to extract formatting rules (font, spacing, section order, bullet style) and apply them to the generated output.

### Phase 2 — Interactive Editing

- **Frontend:** React-based web application.
- **Rich Text Editor:** Tiptap or ProseMirror for document editing with comment/annotation support.
- **Backend:** Node.js or Python service that communicates with the Claude API for AI-driven revisions.
- **Diff Engine:** Use a text diffing library to compute and display changes between revision rounds.

### Phase 3 — Auto-Fill

- **Browser Automation:** Use MCP (Model Context Protocol) servers or a browser extension (Chrome Extension with content scripts) to interact with web forms.
- **Form Detection:** Build a form field detection module that maps common field labels (e.g., "First Name," "Company," "Job Title") to the user's profile data.
- **Platform-Specific Adapters:** Workday portals have a consistent DOM structure. Build a Workday-specific adapter first, then generalize.

### Cross-Cutting

- **Data Storage:** User profiles, master resumes, and generated documents should be stored locally (file system) for V1. Cloud storage can be added later.
- **Security:** The user's personal data and resume content must never be shared or stored externally beyond what is required for AI API calls. Clearly communicate data handling to users.

---

## 8. Dependencies

| Dependency                              | Phase   | Description                                                          |
| --------------------------------------- | ------- | -------------------------------------------------------------------- |
| Anthropic Claude API                    | 1, 2, 3 | Core AI engine for resume tailoring, editing, and question answering |
| GitHub API / local git                  | 1       | Retrieve codebase context (project info, technologies, READMEs)      |
| Document parsing libraries              | 1       | Parse .docx, Markdown, PDF files for context extraction              |
| Rich text editor (Tiptap / ProseMirror) | 2       | Enable inline document editing with comments                         |
| MCP or Chrome Extension APIs            | 3       | Browser automation for form filling                                  |
| Workday portal access                   | 3       | Target platform for auto-fill testing and development                |

---

## 9. Assumptions

1. Users have an existing resume in .docx format that can serve as a style template.
2. Users have access to their own GitHub repositories or can provide local project directories.
3. Users have project documents (PRDs, notes, etc.) available in readable formats (Markdown, .docx, or PDF).
4. Workday-based portals maintain a sufficiently consistent DOM structure across different employers for automation to be feasible.
5. The Claude API provides sufficient context window size to process a job description + user profile + resume template in a single request.
6. Users are comfortable reviewing and approving AI-generated content before submission.
7. This is initially a personal/team productivity tool; user authentication and multi-tenancy are not required for V1.

---

## 10. Success Metrics

| Metric                                                   | Target                                          |
| -------------------------------------------------------- | ----------------------------------------------- |
| Time to produce a tailored resume                        | < 5 minutes (down from 30–60 min)               |
| User satisfaction with tailored resume quality           | ≥ 4/5 rating on self-assessment                 |
| Percentage of resume content backed by real project data | ≥ 80% of bullet points reference concrete facts |
| Time to complete a job application (with auto-fill)      | < 10 minutes (down from 20–40 min)              |
| Number of applications per day achievable by one user    | ≥ 10 applications/day                           |
| Editing iterations needed before user is satisfied       | ≤ 3 rounds on average                           |

---

## 11. MVP Validation Criteria

### Phase 1 (Resume Tailoring) — Core MVP

- [ ] User can input a job description and receive a tailored resume within 2 minutes.
- [ ] The generated resume uses facts extracted from at least one codebase or project document.
- [ ] The generated resume matches the style (formatting, tone, structure) of the user's template.
- [ ] Output is a valid .docx file that opens correctly in Microsoft Word and Google Docs.
- [ ] The tailored resume demonstrably differs from the template based on the job description.

### Phase 2 (Interactive Editing)

- [ ] User can view the generated resume in a web editor.
- [ ] User can select text and leave a comment; the AI revises only the targeted section.
- [ ] At least 3 rounds of iterative editing work correctly in a single session.
- [ ] Changes are visually highlighted (diff view).

### Phase 3 (Auto-Fill)

- [ ] The tool successfully auto-fills a Workday application form with user profile data.
- [ ] Screening question answers are generated and presented for review.
- [ ] No form is submitted without explicit user confirmation.
- [ ] Auto-fill works on at least 3 different Workday-based employer portals.

---

## 12. Suggested Phasing

Based on dependency relationships and value delivery, the recommended build order is:

### Phase 1: Resume Tailoring Engine (Weeks 1–4)

This is the foundation. It delivers the highest standalone value and does not depend on a UI — it can initially run as a CLI tool or script. Start here because everything else builds on the tailored resume output.

### Phase 2: Interactive Editing Interface (Weeks 5–8)

This transforms the one-shot tailoring into an iterative workflow. It depends on Phase 1 (needs a generated resume to edit) and provides the collaborative AI experience that differentiates this tool from existing solutions.

### Phase 3: Auto-Fill Application Forms (Weeks 9–12)

This has the most external dependencies (browser automation, platform-specific adapters) and is the riskiest phase. Building it last allows you to validate Phases 1 and 2 first, and the user profile data model built in earlier phases feeds directly into auto-fill.

---

## 13. Related PRDs

- (None at this time. Future PRDs may cover: Cover Letter Generation, Multi-Platform ATS Support, Job Search Integration.)

---

## PRD Quality Checklist

- [x] Addresses a clear user problem (time-consuming resume tailoring and application filling)
- [x] Has measurable success criteria (time targets, quality ratings, application throughput)
- [x] Contains no ambiguous requirements (all FRs use specific, testable language)
- [x] Specifies all critical user flows (tailoring → editing → auto-fill)
- [x] Identifies key edge cases (user confirmation before submission, diff view for changes)
- [x] Is achievable within project constraints (phased approach, starting with CLI)
- [x] Uses language suitable for junior developers
- [x] Includes all sections from the PRD structure
