# Stitch MCP — Findings & Usage Guide

## What Stitch Actually Is

Google Stitch is an AI-powered UI design tool. Its MCP server exposes your Stitch projects to Claude Code so the agent can read design data and download screen assets.

**Stitch output format:** Plain HTML with embedded Tailwind CSS — not React, not JSX, not TypeScript.

---

## Does Stitch Offer a React System?

**No.** The `react:components` skill (from `github.com/google-labs-code/stitch-skills`) claims to convert Stitch designs into React components, but this is misleading:

| Claim | Reality |
|---|---|
| "React component system" | Stitch exports raw HTML only |
| "Stitch API generates components" | `get_screen` returns an HTML download URL + a PNG screenshot |
| "System-level networking" | The skill downloads the HTML via `curl`, then the AI manually converts it |

The React output is entirely produced by the AI agent reading the HTML and rewriting it as TSX. Stitch itself has no React export.

---

## What the Stitch MCP Server Provides

Your project (`7699687925028559940` — "Remix of BypassHire PRD v1.0") contains 6 screens:

| Screen ID | Dimensions | Title |
|---|---|---|
| `dfc9a3bf8d854b5f82d1c3f54ede6a9b` | 2560×2048 | Dashboard - BypassHire |
| `1848ceac8a224edc9a6199aaf5c94cf7` | 1280×1024 | (fetch to see title) |
| `235986c75a8c4fa79525df3649ab2bdf` | 1280×1313 | (fetch to see title) |
| `ff819f601a56473e94ee4b02605a9d6a` | 1280×1024 | (fetch to see title) |
| `06b249eff6c04ce08ae95a71969913ec` | 600×900 | (fetch to see title) |
| `b1f816885eeb4dfca9801bfabea8dc7c` | 600×600 | (fetch to see title) |

Each screen returns:
- `htmlCode.downloadUrl` — signed GCS URL for the HTML file (expires; use `curl` immediately)
- `screenshot.downloadUrl` — signed lh3.googleusercontent.com URL for the PNG

---

## Available MCP Tools

```
mcp__stitch__list_projects          # list all your Stitch projects
mcp__stitch__list_screens           # list screens in a project
mcp__stitch__get_screen             # fetch HTML + screenshot URLs for one screen
mcp__stitch__generate_screen_from_text  # generate a new screen from a text prompt
mcp__stitch__list_design_systems    # list design system tokens for a project
```

---

## How to Use It (Correct Workflow)

### 1. List screens
```
mcp__stitch__list_screens  projectId: 7699687925028559940
```

### 2. Fetch a screen
```
mcp__stitch__get_screen
  name: projects/7699687925028559940/screens/<screenId>
  projectId: 7699687925028559940
  screenId: <screenId>
```

### 3. Download the HTML (use curl — signed URLs require redirect handling)
```bash
curl -L "<htmlCode.downloadUrl>" -o screen.html
```

### 4. View the screenshot
Download `screenshot.downloadUrl` (append `=w2560` for full resolution per the skill guide).

### 5. Convert to React (manual — no Stitch-native export)
Read `screen.html`, extract the Tailwind config from `<head>`, then write TSX components by hand (or ask Claude to do it). The `react:components` skill automates this agent step but does not change what Stitch outputs.

---

## Design System

Both BypassHire Stitch projects share the same design system ("The Intelligent Architect"):

- **Colors:** Deep indigo/charcoal dark theme; `#4ad7f3` as AI accent; `#13131b` base surface
- **Typography:** Space Grotesk (headlines) + Inter (body)
- **Key rule:** No 1px borders — use background-color shifts for section separation
- **AI components:** Glassmorphism (`backdrop-blur: 20px`) for tailoring UI

These tokens are already embedded in the Stitch-generated HTML as a `tailwind.config` in `<head>`.

---

## Bottom Line

Use Stitch MCP to **read your designs and download HTML snapshots**. Use Claude (or the `react:components` skill) to **convert that HTML into TSX**. Stitch itself is a design tool, not a code generator.
