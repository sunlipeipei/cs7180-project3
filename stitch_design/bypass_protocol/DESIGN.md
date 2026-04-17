# Design System Specification: The Intelligent Architect

## 1. Overview & Creative North Star
The North Star for this design system is **"The Digital Architect."** 

In an industry saturated with generic "SaaS-blue" dashboards, this system rejects the template-driven aesthetic in favor of high-end editorial precision. We are building a tool for developers—a demographic that values efficiency, technical depth, and structural integrity. 

This system moves beyond basic minimalism into **Structural Sophistication**. We achieve this by breaking the rigid, boxed-in grid of traditional web apps. We utilize intentional asymmetry, varying content densities, and high-contrast typography scales (Space Grotesk vs. Inter) to guide the eye. The UI should feel like a premium IDE or a high-end technical journal: authoritative, quiet, and exceptionally powerful.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
We use a palette of deep indigos and charcoals to create an environment of focus. The secondary accent (`#4ad7f3`) is reserved exclusively for AI-driven insights and "moment of truth" actions.

### The "No-Line" Rule
Standard 1px borders are a crutch. In this system, **physical borders are prohibited for sectioning.** Boundaries must be defined through background shifts or elevation stacking. 
- Use `surface-container-low` for large section backgrounds.
- Use `surface-container-high` for interactive elements within those sections.
- This creates a "molded" look, as if the UI is carved from a single block of material rather than assembled from separate boxes.

### Glass & Gradient (The AI Signature)
To elevate the AI experience, components performing resume tailoring should utilize **Glassmorphism**.
- **Token:** `secondary-container` at 12% opacity + `backdrop-blur: 20px`.
- **Gradients:** Use a linear gradient from `primary` (#c6c5d4) to `primary-container` (#1a1b26) for hero CTAs to provide a metallic, high-end "sheen" that flat fills lack.

---

## 3. Typography: Editorial Authority
We pair the brutalist, geometric nature of **Space Grotesk** for headings with the hyper-legible **Inter** for data-heavy resume content.

*   **Display & Headlines (Space Grotesk):** Use `display-lg` (3.5rem) for landing moments and `headline-sm` (1.5rem) for section headers. The wide tracking of Space Grotesk provides a "technical premium" feel.
*   **Body & Titles (Inter):** All resume content and technical descriptions use Inter. 
    *   `title-md` (1.125rem) for field labels.
    *   `body-md` (0.875rem) for the "developer-focused" technical descriptions.
*   **The Technical Mono:** While not in the primary scale, use a Monospace font (System Mono) for resume "keywords" or "code snippets" to satisfy the developer persona.

---

## 4. Elevation & Depth: Tonal Layering
We achieve hierarchy not through shadows that "float," but through **Tonal Layering.**

*   **The Layering Principle:** 
    *   Base Page: `surface` (#13131b)
    *   Main Content Area: `surface-container-low` (#1b1b23)
    *   Interactive Cards/Inputs: `surface-container-high` (#292932)
*   **Ambient Shadows:** If a floating element (like a modal) is required, use a shadow with a 40px blur at 6% opacity, using the `on-surface` color as the tint. This mimics natural light reflecting off dark materials.
*   **The "Ghost Border" Fallback:** If a border is required for high-contrast accessibility, use `outline-variant` (#47464c) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons: The Kinetic Engine
*   **Primary:** Solid `secondary` (#4ad7f3) with `on-secondary` (#00363f) text. Use `xl` (0.75rem) roundedness. 
*   **Secondary (Action):** `surface-container-highest` background with a `secondary` ghost border (15% opacity).
*   **Tertiary:** Text-only using `primary-fixed-dim` for a subtle, low-priority look.

### Input Fields: Focus & Precision
*   **Structure:** No background fill. Use a bottom-only `outline-variant` (20% opacity). On focus, animate a 2px `secondary` underline. 
*   **Labels:** Always use `label-md` in `on-surface-variant`.

### Chips: Intelligence Tags
*   For keywords found in a resume: Use `tertiary-container` with `on-tertiary-container` text.
*   Shape: `full` (9999px) to contrast against the sharp, rectangular layout of the rest of the app.

### Cards & Lists: The Separation Principle
**Forbid divider lines.** To separate resume versions or job descriptions:
1.  Increase vertical spacing using the `12` (2.75rem) or `16` (3.5rem) scale tokens.
2.  Shift the background color of alternating items from `surface` to `surface-container-lowest`.

### The "Tailor" Progress Bar
A custom component for this app. Use a thin (2px) track of `surface-variant` with a glowing `secondary` (#4ad7f3) fill that utilizes a `box-shadow: 0 0 10px #4ad7f3` to simulate energy.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a separator. If you think you need a line, try adding `1.75rem` (Scale 8) of padding instead.
*   **DO** lean into "Developer Dense" info for the editor view—developers prefer seeing more data at once than scrolling through "fluff."
*   **DO** use `secondary_fixed` for AI-suggested text changes to make them vibrate against the dark background.

### Don’t
*   **DON'T** use pure black (#000) or pure white (#FFF). Stick strictly to the `surface` and `on-surface` tokens to maintain the premium tonal range.
*   **DON'T** use standard "drop shadows" on cards. They look dated. Use the Tonal Layering method described in Section 4.
*   **DON'T** use bright colors for non-AI actions. If it’s not "smart," it should be `primary` or `neutral`.

---

## 7. Spacing Scale (Reference)
Use these tokens to ensure mathematical harmony:
- **Tight (Inputs/Labels):** `2` (0.4rem) or `2.5` (0.5rem)
- **Standard (Card Padding):** `5` (1.1rem)
- **Section Gaps:** `10` (2.25rem) or `12` (2.75rem)
- **Hero Breathing Room:** `24` (5.5rem)