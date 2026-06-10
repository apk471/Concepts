import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { getAllNotes, getNotesByCategory } from "@/lib/notes";

export const metadata: Metadata = {
  title: "About",
  description: "About Concepts — a personal collection of engineering notes.",
};

export default function About() {
  const total = getAllNotes().length;
  const sections = getNotesByCategory();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-neutral-950">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
          About
        </h1>
        <div className="prose prose-neutral mt-6 max-w-none dark:prose-invert">
          <p>
            <strong>Concepts</strong> is a personal, searchable collection of
            engineering notes — written while learning and kept here as a
            reference. It currently holds {total} notes across{" "}
            {sections.length} areas:
          </p>
          <ul>
            {sections.map((s) => (
              <li key={s.key}>
                <strong>{s.label}</strong> — {s.blurb}
              </li>
            ))}
          </ul>
          <p>
            The notes are plain Markdown files. Press{" "}
            <kbd>⌘K</kbd> anywhere to search, or browse by category from the{" "}
            <Link href="/">home page</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
