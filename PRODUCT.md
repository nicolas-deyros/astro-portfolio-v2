# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web

## Users

Three public audiences, confirmed by the owner:

- **Recruiters and employers** evaluating Nicolás Deyros as a Full Stack Developer and Project Manager.
- **Potential clients** looking to hire freelance or consulting work.
- **Technical readers** who arrive through a blog post or the links collection and want to read.

Two private audiences use authenticated areas:

- **The site owner** (single admin) managing links, clients, and CRM data under `/admin`.
- **Existing clients** signing in to the client portal (`/client`, `/clients/[slug]`) to download private files and read pages prepared for them.

## Product Purpose

Personal site of Nicolás Deyros. It publishes the owner's writing (MDX blog) and a curated, searchable collection of links, introduces the owner, and gives clients a private place to receive files.

Success for the public site is **reading and return**: a visitor reads posts, uses the links, and comes back. Inbound contact is welcome but secondary.

## Positioning

One person's working notebook made public: blog and links are maintained by the same person who built the site, and the site itself is built to a measurable quality bar (Lighthouse 90+, tested, typed).

## Operating Context

- Public pages: home, blog (posts, tags, categories, pagination), links (tag filter, free-text search, bookmarkable URLs), contact form, 404.
- Blog posts can carry an audio player and on-device Chrome AI summarization and translation.
- Light and dark themes, following system preference, persisted across view transitions.
- Admin and client portal are task tools used by few, known people on desktop and mobile.
- Site UI language is English. Some client pages are in Spanish.

## Capabilities and Constraints

- Astro 7 with islands; static HTML by default, React 19 only where interaction needs it.
- Tailwind CSS 4 utilities; no custom design-token layer yet.
- Performance target: Lighthouse 90+ on every category. UI work must not regress it.
- Client files are private (Vercel Blob, signed URLs); client pages are isolated per client slug.
- Undecided: target audience priority among the three public groups beyond "reading and return".

## Brand Commitments

- Name: Nicolás Deyros. Home title: "Full Stack Developer & Project Manager".
- Home hero roles, in order: Developer, Project Manager, Advertiser, a.k.a Problem Solver.
- Current visual identity is kept. Work on the UI is refinement, not redesign.

## Evidence on Hand

- Real blog posts in `src/content/blog/` and real link data in the database.
- Social profiles linked from home: GitHub, LinkedIn, YouTube.
- No testimonials, client logos, case studies, or metrics exist on the site. Do not fabricate them.

## Product Principles

1. **Reading first.** Posts and links are the reason to visit; chrome stays out of the way.
2. **Earn the return visit.** Finding, filtering, and resuming content must be fast and predictable.
3. **The site is the proof.** Performance, accessibility, and correctness are part of the message.
4. **Tools for known users stay plain.** Admin and client portal favour clarity and consistency over expression.

## Accessibility & Inclusion

WCAG 2.2 AA is the required standard on all three surfaces: public site, admin, client portal.
