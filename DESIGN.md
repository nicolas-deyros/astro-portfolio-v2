---
name: Nicolás Deyros Portfolio
description: Personal site for reading posts and links, with plain tools for admin and clients.
colors:
  ink-blue: '#2563eb'
  ink-blue-deep: '#1d4ed8'
  ink-blue-focus: '#3b82f6'
  ink-blue-night: '#60a5fa'
  paper: '#ffffff'
  paper-field: '#f8fafc'
  night: '#111827'
  night-raised: '#1f2937'
  night-control: '#374151'
  text-strong: '#0f172a'
  text-body: '#334155'
  text-muted: '#64748b'
  text-night-body: '#cbd5e1'
  text-night-muted: '#94a3b8'
  rule: '#e2e8f0'
  rule-control: '#cbd5e1'
  rule-night: '#334155'
  danger: '#b91c1c'
  danger-field: '#fef2f2'
  danger-rule: '#ef4444'
typography:
  display:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.875rem, 6vw, 4.5rem)'
    fontWeight: 400
    lineHeight: 1
  headline:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: 1.33
rounded:
  md: '6px'
  lg: '8px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '20px'
  xl: '40px'
components:
  button-primary:
    backgroundColor: '{colors.ink-blue}'
    textColor: '{colors.paper}'
    rounded: '{rounded.md}'
    padding: '8px 16px'
  button-primary-hover:
    backgroundColor: '{colors.ink-blue-deep}'
  input:
    backgroundColor: '{colors.paper-field}'
    textColor: '{colors.text-strong}'
    rounded: '{rounded.md}'
    padding: '10px'
  input-error:
    backgroundColor: '{colors.danger-field}'
    textColor: '{colors.danger}'
  tag:
    rounded: '{rounded.md}'
    padding: '4px 8px'
    typography: '{typography.label}'
  list-row:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.text-strong}'
    padding: '20px 0'
---

# Design System: Nicolás Deyros Portfolio

This file records the visual system as it exists in the code today. It is the baseline for refinement, not a redesign brief. Color values are the hex equivalents of the Tailwind palette steps the code uses (Tailwind 4 ships them as OKLCH; the utility class is the source of truth).

## Overview

**Creative North Star: "The Working Notebook"**

A public working notebook. The page is plain paper, the writing is the subject, and the interface steps back. Nothing is decorative: one accent color, system type, thin rules between entries. The same restraint carries into the admin and client portal, where it reads as precision instead of minimalism.

Density is moderate on reading pages and compact in the tools. Small type (14px) does most of the work; size jumps are reserved for the home name and page headings. Light and dark are equal citizens, switched by a `.dark` class on the root.

**Key Characteristics:**

- White page, near-black night mode, slate text.
- A single blue accent, used for links, primary actions, and focus.
- System sans-serif throughout; hierarchy comes from weight and size, not from a second family.
- Flat surfaces separated by rules; shadow only on things that float.
- Sober, precise controls with a medium corner radius.

## Colors

A neutral slate-on-white palette with one blue voice and a red reserved for errors.

### Primary

- **Ink Blue** (`ink-blue`): links on hover, text links, primary button fill. Night mode uses **Ink Blue Night** (`ink-blue-night`) for the same roles on text.
- **Ink Blue Deep** (`ink-blue-deep`): hover state of the primary button.
- **Ink Blue Focus** (`ink-blue-focus`): focus ring and focused input border.

### Neutral

- **Paper** (`paper`) and **Night** (`night`): page background in light and dark.
- **Paper Field** (`paper-field`): resting background of inputs.
- **Night Raised** (`night-raised`) and **Night Control** (`night-control`): panels and controls in dark mode.
- **Text Strong / Body / Muted** (`text-strong`, `text-body`, `text-muted`): headings and titles, running text, metadata and dates.
- **Text Night Body / Muted** (`text-night-body`, `text-night-muted`): the dark-mode counterparts.
- **Rule** (`rule`), **Rule Control** (`rule-control`), **Rule Night** (`rule-night`): dividers between list entries, input borders, dark-mode borders.

### Semantic

- **Danger** (`danger`), **Danger Field** (`danger-field`), **Danger Rule** (`danger-rule`): error text, error input background, error border and ring.

### Named Rules

**The One Voice Rule.** Blue is the only accent. It marks what can be clicked or what has focus, and nothing else.

**The Two Greys Problem.** The code mixes Tailwind `gray-*` and `slate-*` for the same roles. Slate is the intended neutral for text and rules; `gray-*` remains on the page background and older admin panels. New work uses slate; do not add a third neutral family.

## Typography

**Display Font:** system sans-serif (`ui-sans-serif, system-ui, sans-serif`)
**Body Font:** the same stack
**Label/Mono Font:** none distinct

**Character:** No web fonts are loaded. The site borrows the reader's own system face, which keeps it fast and unpretentious; hierarchy is carried by weight (medium for controls, bold for titles) and a short size scale.

### Hierarchy

- **Display** (400, 30px rising to 72px, line-height 1): the name on the home hero only.
- **Headline** (700, 30px): page headings.
- **Title** (700, 20px; 16–18px for entry titles): section headings and post or link titles.
- **Body** (400, 14px): running text in lists, cards, forms, and tools. Long-form blog content uses the Tailwind typography plugin's `prose` scale instead.
- **Label** (500, 12px): tags, dates, metadata, table headers.

### Named Rules

**The One Family Rule.** One type family. Do not add a second face to create contrast; use weight and size.

## Layout

A centred `container` with 20px side padding (40px from `md`), and 80px of vertical margin around `main`. Reading columns are capped: link entries at `max-w-2xl` (672px), home post rows at `max-w-xl` (576px), auth forms at `max-w-md` (448px), tools up to `max-w-7xl`. The home page moves from one column to two at `lg`. Vertical rhythm inside entries is 12px; between sections 16–48px by breakpoint.

## Elevation & Depth

Flat by default. Depth is conveyed by a rule or a border, and in dark mode by a one-step lighter surface (`night` to `night-raised` to `night-control`).

### Shadow Vocabulary

- **Float** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): modals, menus, and the back-to-top button.

### Named Rules

**The Flat-By-Default Rule.** A surface at rest has no shadow. Shadow means "this floats above the page". Existing `shadow-sm` on resting cards and the scattered `shadow-xl` / `shadow-2xl` uses are deviations to resolve, not patterns to copy.

## Shapes

Medium, consistent corners: 6px (`rounded-md`) on buttons, inputs, and tags; 8px (`rounded-lg`) on images and panels; full radius on icon buttons, avatars, and favicons. Borders are 1px on controls and a 2px bottom rule between list entries. No clipped or decorative shapes.

## Components

Sober and precise: flat fills, fine borders, state shown by color change over 200–300ms.

### Buttons

- **Shape:** medium corners (6px); icon-only buttons are fully round.
- **Primary:** Ink Blue fill, white text, 14px medium, 8px by 16px padding.
- **Hover / Focus:** fill deepens to Ink Blue Deep; focus shows a 2px Ink Blue Focus ring with a 2px offset.
- **Ghost (like, share):** muted slate text, round, tinted background on hover (rose for like, blue for share).

### Chips

- **Style:** 12px medium text, 6px radius, 4px by 8px padding, tinted background with a 1px inset ring; hue varies by tag.

### Cards / Containers

- **List row (signature):** posts and links are rows, not boxes: no background, no radius, a 2px bottom rule in Rule, 20px vertical padding. Entries fade up on load.
- **Panels (admin, portal):** Paper or Night Raised surface, 1px border, 8px radius.

### Inputs / Fields

- **Style:** 1px Rule Control border, Paper Field background, 6px radius, 10px padding, 14px text. Label above in 14px medium.
- **Focus:** border and ring shift to Ink Blue Focus; background turns Paper.
- **Error:** Danger Rule border, Danger Field background, Danger text, message below linked with `aria-describedby`; the field shakes once.

### Navigation

- Logo mark on the left, menu on the right, in a 20px-tall bar inside the container. Links are muted slate, darkening on hover with a 200–300ms color transition. A theme toggle sits in the menu, with a separate control for mobile.

## Do's and Don'ts

### Do:

- **Do** use Ink Blue for links, primary actions, and focus only.
- **Do** separate entries with a rule or border, not a shadow.
- **Do** keep a visible focus indicator on every interactive element: 2px ring, 2px offset.
- **Do** style light and dark together; every color utility has its `dark:` pair.
- **Do** meet WCAG 2.2 AA contrast (4.5:1 text, 3:1 UI) in both themes.

### Don't:

- **Don't** load a web font or add a second type family.
- **Don't** add a second accent color.
- **Don't** put a shadow on a surface at rest.
- **Don't** introduce a new neutral family alongside slate.
- **Don't** remove an outline without replacing it with a visible focus style.
