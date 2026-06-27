import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Note {
  slug: string; // e.g. "system-design/basics/workers"
  segments: string[]; // ["system-design", "basics", "workers"]
  title: string;
  description: string;
  category: string; // top-level dir key, e.g. "system-design"
  categoryLabel: string; // "System Design"
  group?: string; // nested dir label, e.g. "Basics"
  body: string; // raw markdown (frontmatter stripped)
  plain: string; // plaintext for search
}

const CONTENT_DIR = path.join(process.cwd(), "content");

// Order + display labels for top-level categories.
const CATEGORY_META: Record<string, { label: string; order: number; blurb: string }> = {
  ai: {
    label: "AI",
    order: 1,
    blurb: "Agent loops, Claude Code skills, worktrees, and MCP servers.",
  },
  "system-design": {
    label: "System Design",
    order: 2,
    blurb: "Fundamentals, capacity planning, and an interview framework.",
  },
  devops: {
    label: "DevOps",
    order: 3,
    blurb: "CI/CD, Docker, and GitHub Actions for backend services.",
  },
  ideas: {
    label: "Ideas",
    order: 4,
    blurb: "Project plans, experiments, and things worth building.",
  },
};

function humanize(s: string): string {
  return s
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(key: string): string {
  return CATEGORY_META[key]?.label ?? humanize(key);
}

// Strip markdown syntax down to readable plaintext.
function toPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // code fences
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/[*_>#~|-]/g, " ") // residual markdown
    .replace(/\s+/g, " ")
    .trim();
}

function deriveTitle(data: Record<string, unknown>, body: string, file: string): string {
  if (typeof data.title === "string" && data.title.trim()) return data.title.trim();
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return humanize(path.basename(file, ".md"));
}

function deriveDescription(data: Record<string, unknown>, body: string): string {
  if (typeof data.description === "string" && data.description.trim()) {
    return data.description.trim();
  }
  // First non-empty paragraph that isn't a heading / fence / list / table.
  const lines = body.split("\n");
  let para = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (para) break;
      continue;
    }
    if (/^(#|`{3}|>|\||[-*+]\s|\d+\.\s|---)/.test(line)) {
      if (para) break;
      continue;
    }
    para += (para ? " " : "") + line;
  }
  const plain = toPlain(para);
  if (!plain) return "";
  return plain.length > 160 ? plain.slice(0, 157).trimEnd() + "…" : plain;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      if (entry.name.toLowerCase() === "readme.md") continue;
      out.push(full);
    }
  }
  return out;
}

let cache: Note[] | null = null;

export function getAllNotes(): Note[] {
  if (cache) return cache;

  const files = walk(CONTENT_DIR);
  const notes: Note[] = files.map((file) => {
    const rel = path.relative(CONTENT_DIR, file);
    const segments = rel.replace(/\.md$/i, "").split(path.sep);
    const raw = fs.readFileSync(file, "utf8");
    // Some notes open with a `---` horizontal rule that isn't valid YAML
    // frontmatter — fall back to treating the whole file as body.
    let data: Record<string, unknown> = {};
    let content = raw;
    try {
      const parsed = matter(raw);
      data = parsed.data;
      content = parsed.content;
    } catch {
      data = {};
      content = raw;
    }
    const category = segments[0];
    // nested dir between category and filename becomes the group label
    const group = segments.length > 2 ? humanize(segments[segments.length - 2]) : undefined;

    return {
      slug: segments.join("/"),
      segments,
      title: deriveTitle(data, content, file),
      description: deriveDescription(data, content),
      category,
      categoryLabel: categoryLabel(category),
      group,
      body: content,
      plain: toPlain(content),
    };
  });

  notes.sort((a, b) => {
    const ao = CATEGORY_META[a.category]?.order ?? 99;
    const bo = CATEGORY_META[b.category]?.order ?? 99;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });

  cache = notes;
  return notes;
}

export function getNoteBySlug(slug: string): Note | undefined {
  return getAllNotes().find((n) => n.slug === slug);
}

export interface CategorySection {
  key: string;
  label: string;
  blurb: string;
  notes: Note[];
}

export function getNotesByCategory(): CategorySection[] {
  const notes = getAllNotes();
  const keys = [...new Set(notes.map((n) => n.category))].sort(
    (a, b) => (CATEGORY_META[a]?.order ?? 99) - (CATEGORY_META[b]?.order ?? 99)
  );
  return keys.map((key) => ({
    key,
    label: categoryLabel(key),
    blurb: CATEGORY_META[key]?.blurb ?? "",
    notes: notes.filter((n) => n.category === key),
  }));
}

// Lightweight index for client-side search.
export interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  categoryLabel: string;
  group?: string;
  text: string; // truncated plaintext body
}

export function getSearchIndex(): SearchEntry[] {
  return getAllNotes().map((n) => ({
    slug: n.slug,
    title: n.title,
    description: n.description,
    categoryLabel: n.categoryLabel,
    group: n.group,
    text: n.plain.slice(0, 600),
  }));
}
