# Notes Site Plan

**Goal:** A personal site that serves the markdown notes in this repo (`devops/`, `system-design/`, `ideas/`) as a clean, browsable web app — reusing the frontend, design system, and logo from the [Concepts](https://github.com/apk471/Concepts) repo.
**Deploy target:** Vercel
**Status:** Planning — pending review before implementation.

---

## What you're building

```
content/ (.md files)          Next.js App Router            Vercel
  devops/            ──┐
  system-design/       ├──►  build-time fs reader  ──►  static pages  ──►  notes.vercel.app
  ideas/             ──┘     (lib/notes.ts)             (one per note)
                                  │
                                  ├─ home grid  (category-grouped cards)
                                  └─ /[...slug]  (rendered markdown page)
```

**Key decisions baked in:**

- **New repo**, notes **copied in** under `content/` (decided). Source notes still live in this Personal repo; site repo gets its own copy. Trade-off: two places to keep in sync — accept for now, automate later (see backlog).
- Reuse the **Concepts design system** as the shell (Next.js 15 + React 19 + Tailwind + framer-motion).
- Markdown rendered at **build time** → fully static, fast, free to host.
- Skip `resume/` (LaTeX) — not part of this site.

---

## Stack

Inherited from Concepts:

- Next.js 15 (App Router) + React 19
- Tailwind CSS 3 + framer-motion
- TypeScript

New dependencies:

| Package | Purpose |
| --- | --- |
| `gray-matter` | Parse optional frontmatter from `.md` files |
| `react-markdown` + `remark-gfm` | Render markdown (tables, task lists, etc.) |
| `rehype-highlight` + `highlight.js` | Syntax highlighting for code blocks |
| `@tailwindcss/typography` | `prose` styling for rendered note bodies |

---

## What carries over vs. what's new

**Reuse as-is (the "logo and stuff"):**

- `globals.css`, `tailwind.config.ts`, `layout.tsx`, `postcss.config.mjs`, `tsconfig.json`, `next.config.ts`
- `header.tsx` (the circle-line logo), the hero + card-grid layout in `page.tsx`
- `experiment-card.tsx` → rename to `note-card.tsx`, keep the styling (rounded border, category pill, title, description, hover arrow)
- `icon.svg`, animations, scrollbar/selection styling

**Throw away:**

- Everything physics-specific: `lib/*-physics.ts`, all per-experiment simulation components, `CardIllustration`/`ExperimentIcon` (physics icons)

**Build new (the only real work):**

1. **Content loader** — `lib/notes.ts` recursively walks `content/`, parses each `.md` (frontmatter via `gray-matter`), derives:
   - `slug` (path minus `.md`, e.g. `system-design/basics/workers`)
   - `title` (frontmatter `title` → first `# H1` → humanized filename)
   - `category` (top-level dir: `devops` / `system-design` / `ideas`)
   - `description` (frontmatter `description` → first paragraph)
   - `body` (raw markdown)
   - Skips `README.md` (or optionally uses it as a category intro)
2. **Home grid** — `page.tsx` groups note cards by category instead of a flat experiment list.
3. **Note route** — `app/[...slug]/page.tsx` catch-all with `generateStaticParams`, renders the markdown body inside a `prose` container. Coexists with a static `/about`.

---

## Content model

Notes are organized by top-level directory = category. Nested dirs (e.g. `system-design/basics/`) become sub-groupings or just deeper slugs.

Optional frontmatter (all fields optional — sensible fallbacks if absent):

```yaml
---
title: Docker for Backend Developers
description: How Docker packages backend apps into reproducible containers.
tags: [docker, containers, devops]
updated: 2026-06-10
---
```

Current state: notes have **no** frontmatter, so the loader must fall back to H1 + first paragraph. Adding frontmatter later is a nice-to-have, not a blocker.

---

## Build phases

1. **Scaffold** — new repo, copy Concepts configs, copy notes into `content/`.
2. **Shell** — bring over `globals.css`, `layout.tsx`, `header.tsx`, `icon.svg`. Adjust site title/metadata (e.g. "Notes" — name TBD).
3. **Loader** — `lib/notes.ts` (fs walk + parse).
4. **Home** — category-grouped card grid + `note-card.tsx`.
5. **Note page** — `[...slug]` route + markdown rendering + `prose` styling + syntax highlighting.
6. **Polish** — about page, metadata, favicon, 404.
7. **Deploy** — push to GitHub, import to Vercel (zero-config for Next.js). Optional custom domain.

---

## What more I can add (backlog — pick what's worth it)

Roughly ordered by value-for-effort:

- **Search** — client-side fuzzy search over titles/content (e.g. command palette with `⌘K`). High value for a growing note collection.
- **Tags** — frontmatter tags → tag pages / filtering on the home grid.
- **Table of contents** — auto-generated from headings, sticky sidebar on note pages.
- **Reading time** — estimate from word count, show on cards.
- **"Last updated"** — pull from git commit date per file at build time (`git log -1`), show on note pages.
- **Code copy button** — one-click copy on code blocks (notes are code-heavy).
- **Dark mode** — toggle; the neutral Concepts palette adapts cleanly.
- **Breadcrumbs** — `devops / docker` nav on note pages.
- **Wiki-links / backlinks** — `[[other-note]]` syntax → cross-links + "linked from" sections. Turns notes into a connected graph.
- **Graph view** — visualize note interconnections (nice given the Concepts repo already does canvas viz).
- **RSS / Atom feed** — for new or updated notes.
- **Reorder/featured** — pin or order notes per category instead of alphabetical.
- **Sync automation** — GitHub Action that mirrors notes from this Personal repo into the site repo on push (solves the two-copies problem).
- **Auth/private notes** — gate `ideas/` behind simple auth if some notes shouldn't be public.

---

## Open decisions (for review)

1. **Site name / title** — "Notes"? "Engineering Notes"? Something branded?
2. **Public vs. private** — is everything (incl. `ideas/`) OK to be publicly indexable on Vercel? `ideas/` has project plans (home server, etc.).
3. **Sync strategy** — manual copy for now, or set up the GitHub Action mirror from day one?
4. **README handling** — skip `README.md` files, or render them as category landing pages?
5. **MVP scope** — ship phases 1–7 first, then add backlog items; or include search/dark-mode in v1?
