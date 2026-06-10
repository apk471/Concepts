# Concepts

A personal, searchable site for engineering notes — DevOps, system design, and ideas — built with Next.js and deployed on Vercel. Notes are plain Markdown files under [`content/`](content/).

## Stack

- Next.js 15 (App Router) + React 19, TypeScript
- Tailwind CSS + `@tailwindcss/typography`
- framer-motion (animations)
- `react-markdown` + `remark-gfm` + `rehype-highlight` (rendering)
- `gray-matter` (optional frontmatter)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static)
```

## Adding a note

Drop a `.md` file under `content/<category>/`. Top-level folders become
categories (`system-design`, `devops`, `ideas`); a nested folder becomes a
group label. Title and description are taken from optional frontmatter, falling
back to the first `# H1` and first paragraph. `README.md` files are ignored.

```yaml
---
title: My Note          # optional
description: One-liner.  # optional
---
```

> Notes are currently copied in manually from the source repo. A sync
> automation is on the backlog.

## Deploy

Import the repo into Vercel — zero config for Next.js. Pushes to `main` deploy
automatically.
