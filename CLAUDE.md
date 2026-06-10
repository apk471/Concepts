# CLAUDE.md

Guidance for working in this repo.

## What this is

**Concepts** — a personal, searchable site for engineering notes (DevOps, system
design, ideas). Notes are plain Markdown under `content/`, rendered as static
pages. Next.js 15 (App Router) + React 19 + Tailwind, deployed on Vercel at
**https://concept-pi.vercel.app**.

## Commands

```bash
npm install
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build — run this to catch type errors
npm run start    # serve the production build
npm run lint
```

> Don't run `npm run build` while `npm run dev` is live — the build overwrites
> `.next` and breaks the running dev server. Stop dev first, or build in a clean
> checkout.

## Architecture

- `content/<category>/…/*.md` — the notes. Top-level folder = category
  (`system-design`, `devops`, `ideas`); a nested folder becomes a group label.
  `README.md` files are ignored.
- `src/lib/notes.ts` — build-time content engine. Walks `content/`, parses
  optional frontmatter (`gray-matter`), derives `title`/`description`/`category`,
  groups by section, and builds a search index. Parsing is defensive: a note that
  opens with a `---` horizontal rule (not valid YAML) falls back to raw body.
- `src/lib/note-visual.ts` — `resolveIcon(slug, title, category)` maps each note
  to one of ~17 illustration keys by keyword, with a per-category fallback.
- `src/app/page.tsx` → `home-content.tsx` — category-grouped card grid.
- `src/app/[...slug]/page.tsx` — static note pages (`generateStaticParams`),
  rendered via `react-markdown` + `remark-gfm` + `rehype-highlight`.
- `src/components/command-menu.tsx` — global ⌘K search, mounted in `layout.tsx`.
- Theming: `darkMode: 'class'`, toggled in `theme-toggle.tsx`, no-flash inline
  script in `layout.tsx`. Syntax-highlight tokens are CSS vars in `globals.css`
  that flip on `.dark`.

## Adding a note

Drop a `.md` file under `content/<category>/`. Title/description come from
optional frontmatter, falling back to the first `# H1` and first paragraph:

```yaml
---
title: My Note          # optional
description: One-liner.  # optional
---
```

If a new topic needs its own illustration, add a keyword rule in
`src/lib/note-visual.ts` and a matching `case` in both
`src/components/card-illustration.tsx` and `src/components/category-icon.tsx`.

> Notes are currently copied in manually from the source notes repo.

## Releases & versioning

Releases are cut by pushing a semver tag. `.github/workflows/release.yml` fires
on any `v*` tag and publishes a GitHub Release whose notes are **auto-generated
from all PRs merged since the previous tag**.

To cut a new version:

```bash
# 1. Bump the version in package.json (e.g. 1.0.0 -> 1.1.0)
# 2. Commit on main, then tag and push the tag:
git tag -a v1.1.0 -m "v1.1.0 — <summary>"
git push origin v1.1.0          # ← triggers the Release workflow
```

Use the standard semver bump: patch for fixes, minor for new notes/features,
major for breaking redesigns. Keep `package.json` `version` in sync with the tag.

## Deploy

Vercel auto-deploys on push to `main` (production) and posts preview URLs on PRs.
There is nothing to run by hand. The canonical domain
(`https://concept-pi.vercel.app`) is referenced in `layout.tsx` metadata,
`sitemap.ts`, and `robots.ts` — update all three if the domain ever changes.

## Conventions

- Reuses the design language of the original Concepts project: neutral palette,
  blur sticky header, circle-line logo, Inter/JetBrains fonts, framer-motion
  entrance animations. Match it when adding UI.
- Every interactive surface supports light **and** dark mode — add `dark:`
  variants on new components.
