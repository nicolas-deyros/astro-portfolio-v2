# UI Audit — 2026-11-13

Baseline audit before the UI polish work. Scope: public site, admin, client portal. Standard: WCAG 2.2 AA (see `PRODUCT.md`). Visual baseline: `DESIGN.md`.

## Method

- `impeccable detect` over `src/` (39 findings, 36 advisory).
- Axe-core 4 (WCAG 2.0/2.1/2.2 A + AA) through Puppeteer on 11 routes, light and dark, at 1280px and 375px; overflow check at 320px.
- Static review of components and pages.
- Screenshots reviewed for home, blog, post, categories, links, contact.

Not covered: authenticated admin and client-portal screens were reviewed from code only (no login against the dev database). Lighthouse was not re-run. Axe samples were capped at three nodes per rule per page, so contrast counts are a floor.

## Health Score

| #         | Dimension                | Score     | Key finding                                                         |
| --------- | ------------------------ | --------- | ------------------------------------------------------------------- |
| 1         | Accessibility            | 2         | Unlabelled theme toggle, dark-mode contrast at 1.71:1, no dialogs   |
| 2         | Performance              | 3         | Not re-measured; staggered entry animation delays content up to 3 s |
| 3         | Responsive design        | 2         | Home page scrolls sideways at 375px and 320px                       |
| 4         | Theming                  | 2         | Footer, pagination, and form fields have no dark variant            |
| 5         | Implementation integrity | 3         | Coherent system; drift is limited to a demo page and two neutrals   |
| **Total** |                          | **12/20** | **Acceptable — significant work needed**                            |

## Implementation Integrity Verdict

Pass. The site expresses one consistent system (slate on white, one blue accent, system type, ruled rows). The three non-advisory detector hits are isolated: a side-stripe border in `src/components/Aside.astro:9`, a purple gradient in `src/components/Skills/SkillBadge.tsx:23`, and gradient text in `src/pages/demo/skill-badges.astro:69`. The remaining 36 advisories are in email templates, the OG image endpoint, and the client page `GuiaApis.jsx`, which legitimately sit outside the site palette.

## Findings

### P1 — WCAG AA violations

1. **Theme toggle has no accessible name.** `src/components/Header/HeaderMenu.astro:94` and `:184`. The checkbox is wrapped in a label with no text. Every page, both viewports. Axe `label` (critical). WCAG 4.1.2, 1.3.1. Fix: `aria-label="Dark mode"` on both inputs. Replace `peer-focus` with `peer-focus-visible` while there.
2. **Pagination is unreadable in dark mode.** `src/components/Pagination.astro:16`. `text-slate-700` has no dark pair: 1.71:1 on blog and links. WCAG 1.4.3. Fix: add `dark:text-slate-300`; change the wrapper `div` to `nav` so `aria-label` applies.
3. **Footer ignores dark mode and fails contrast in both themes.** `src/components/Footer.astro:8`. `text-slate-500` on `bg-slate-200` is 3.86:1 and stays light on a dark page. WCAG 1.4.3. Fix: `text-slate-600` plus `dark:bg-slate-800 dark:text-slate-300`.
4. **Desktop nav items are list items without a list.** `src/components/Header/HeaderMenu.astro:55`. `NavList` renders `li` straight inside `nav`. Axe `listitem` (serious), 84 nodes. WCAG 1.3.1. Fix: wrap in `ul`.
5. **Home page scrolls horizontally on phones.** 34px at 375px, 89px at 320px. `src/pages/index.astro:19` fixes the hero at `w-[300px]`, and rows in `src/components/Home/TopPosts.astro:56` do not shrink (`truncate` is on the link, not on a `min-w-0` flex child). WCAG 1.4.10. Fix: `w-full max-w-[300px]`; `min-w-0` on the heading.
6. **Modals are not dialogs.** `src/components/Admin/ConfirmModal.tsx:62`, `ErrorModal.tsx:10`, `AdminClientsManager.tsx:28`, `src/pages/admin/crm.astro:335`. No `role="dialog"`, no `aria-modal`, no Escape, no focus containment; the CRM backdrop is a clickable `div`. WCAG 4.1.2, 2.1.2, 2.4.3. Fix: native `<dialog>` with `showModal()` in each (focus trap, Escape, and backdrop come free).
7. **No reduced-motion handling anywhere.** Zero `prefers-reduced-motion` or `motion-reduce` in `src/`. The home typewriter (`src/pages/index.astro:69`) loops forever with no pause; entry animations run on every list. WCAG 2.2.2, 2.3.3. Fix: one `@media (prefers-reduced-motion: reduce)` block in `src/styles/global.css` for the entry animations; render the typewriter roles statically under the same query.
8. **Reading-progress badge fails contrast and covers the theme toggle.** `src/pages/blog/[slug].astro:82`. 3.61:1 in light mode; sits on top of the toggle at desktop width. WCAG 1.4.3. Fix: darker text token and move it clear of the header.
9. **Form fields have no dark variant.** `src/components/Form/Input.tsx:14` (also `TextArea.tsx`). Fields stay `bg-slate-50` on a dark page, and `dark:text-slate-500` puts mid-grey text on that light field. WCAG 1.4.3. Fix: `dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100`.

### P2 — Minor

10. **Heading outlines skip or lack a level.** Home `h1 → h3 → h4`; blog index starts at `h2`; categories, tags, links start at `h3`; contact has only an `h3`. WCAG 1.3.1 (advisory), SEO. Fix: one `h1` per page, then `h2` for sections and entries. Class names stay, so the look does not change.
11. **Desktop nav labels appear on hover only.** `src/components/Link/NavLink.astro:37`. Icon-only links; the text is `opacity-0` until `group-hover`, so keyboard and touch users never see it. Fix: add `group-focus-visible:` pairs, or show labels permanently.
12. **Home hero pushes the name below the fold at 1280×800.** `src/pages/index.astro:20`. The icon is `lg:w-2/4` of the container (about 430×560px). Fix: cap with `max-w-xs`.
13. **Entry animation hides content.** `TopPosts.astro:57` delays each row by 500 ms from `opacity: 0`, so the sixth post appears after about 3 s; `LinkCard.astro:36` uses 100 ms. The `fadeInUp` keyframes are duplicated in three components. Fix: move the keyframes to `global.css` once, cap the stagger at 60 ms.
14. **Mobile menu shadow leaks onto the page edge.** `HeaderMenu.astro:116`. The off-canvas panel keeps `shadow-xl` while translated out, drawing a grey strip down the right side on phones. The closed panel is also still focusable. Fix: `invisible` when closed (removes shadow and tab stops).
15. **Low-contrast helper text in tools.** `text-gray-400` / `text-slate-400` on white for empty states, "(optional)", and close buttons: `AdminClientsManager.tsx:347,622,644,650,652`, `LinkForm.tsx:200,215`, `FileBrowser.tsx:162,184`, `TopPosts.astro:48`, `TopLinks.astro:78`. About 2.6:1. Fix: step to `-500` in light mode.
16. **Icon-only close buttons use a bare "✕".** `AdminClientsManager.tsx:622,644`. No accessible name, roughly 24px target. Fix: `aria-label="Cancel"` and `p-2`.
17. **Missing meta description** on `/blog/` and `/contact/`. Fix: pass `description` to `Layout`.
18. **Small touch targets.** "Visit link →" is 70×20px (`LinkCard.astro:116`); the audio seek bar is 8px tall. WCAG 2.5.8 (24px). Fix: `py-1` on the link; taller hit area on the range input.
19. **Footer is cramped on phones.** `Footer.astro:8` has no horizontal padding or wrap; text touches both edges at 375px. Fix: `flex-wrap px-5`.

### P3 — Polish

20. **Two neutral families.** `gray-*` and `slate-*` are used for the same roles (see `DESIGN.md`, "The Two Greys Problem"). Converge on slate opportunistically when a file is touched; no bulk rewrite.
21. **Shadows on resting surfaces.** 24 uses of `shadow-sm` plus scattered `lg`/`xl`/`2xl` conflict with the flat-by-default rule. Remove when touching each component.
22. **Contact button reads "Complete Form" while disabled.** `ContactUS.tsx:135`. States a precondition, not the action. Fix: keep "Send message" and rely on the disabled state and field errors.
23. **Debug `console.log`** on every non-home navigation: `src/pages/index.astro:122`.
24. **Author name is inconsistent** in post front matter: "Nicolás Deyros" and "Nicolas Deyros". Content fix.

## Systemic Patterns

- **Dark mode is applied per element, so gaps are per element.** Footer, pagination, inputs, and the progress badge each miss a `dark:` pair. There is no token layer to catch it.
- **Overlays are hand-built four times.** One native `<dialog>` pattern would close finding 6 everywhere.
- **Motion is unconditional.** One media query closes finding 7.

## What Works

- Every image has `alt`; decorative ones use `alt=""`.
- Focus rings are present on nearly all controls (2px blue ring with offset).
- Contact form errors are wired with `aria-invalid` and `aria-describedby`, with a polite live region for the result.
- Like buttons use `aria-pressed`, optimistic update, and rollback.
- No web fonts; static HTML by default.
- The 404 page already has a correct `h1 → h2` outline and a meta description (the debt note in `CLAUDE.md` is stale).

## Proposed Order

1. Public site: findings 1–5, 7–14, 17–19, 22–23.
2. Client portal: findings 6 (shared dialog), 15, 16, plus a logged-in pass.
3. Admin: findings 6, 15, 16, 20, 21, plus a logged-in pass.

Each fix goes through the smallest-change gate before it is written. Re-run this audit after each PR.
