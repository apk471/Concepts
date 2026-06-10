import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Markdown } from "@/components/markdown";
import { getAllNotes, getNoteBySlug } from "@/lib/notes";

export function generateStaticParams() {
  return getAllNotes().map((n) => ({ slug: n.segments }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getNoteBySlug(slug.join("/"));
  if (!note) return {};
  return {
    title: note.title,
    description: note.description || undefined,
    openGraph: { title: note.title, description: note.description || undefined },
  };
}

// Drop the leading H1 — we render the title from metadata above the body.
function stripLeadingH1(body: string): string {
  return body.replace(/^\s*#\s+.+\n+/, "");
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const note = getNoteBySlug(slug.join("/"));
  if (!note) notFound();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-neutral-950">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          <Link href="/" className="transition-colors hover:text-neutral-700 dark:hover:text-neutral-300">
            Notes
          </Link>
          <span>/</span>
          <span>{note.categoryLabel}</span>
          {note.group && (
            <>
              <span>/</span>
              <span>{note.group}</span>
            </>
          )}
        </nav>

        {/* Title */}
        <header className="mb-10 border-b border-neutral-200 pb-8 dark:border-neutral-800">
          <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {note.group ?? note.categoryLabel}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
            {note.title}
          </h1>
          {note.description && (
            <p className="mt-3 text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
              {note.description}
            </p>
          )}
        </header>

        {/* Body */}
        <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight prose-pre:p-4 prose-img:rounded-xl">
          <Markdown source={stripLeadingH1(note.body)} />
        </article>

        {/* Back link */}
        <div className="mt-16 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            All notes
          </Link>
        </div>
      </main>
    </div>
  );
}
