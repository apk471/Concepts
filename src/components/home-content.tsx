"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { NoteCard } from "@/components/note-card";
import type { CategorySection } from "@/lib/notes";

export function HomeContent({
  sections,
  total,
}: {
  sections: CategorySection[];
  total: number;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-neutral-950">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16"
        >
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-50">
            Concepts
          </h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            by Ayush
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
            My engineering brain dump. Notes, project ideas, lessons learned,
            interview prep, and things I don&apos;t want to relearn twice.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-400 dark:text-neutral-500">
            Browse a category below, or press{" "}
            <kbd className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              ⌘K
            </kbd>{" "}
            to search.
          </p>
        </motion.div>

        {/* Sections */}
        {sections.map((section, si) => (
          <section key={section.key} className="mb-14">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + si * 0.05 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  {section.label}
                </span>
                <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
                <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
                  {section.notes.length}
                </span>
              </div>
              {section.blurb && (
                <p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500">
                  {section.blurb}
                </p>
              )}
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.notes.map((note, i) => (
                <NoteCard key={note.slug} note={note} index={i} />
              ))}
            </div>
          </section>
        ))}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-20 border-t border-neutral-200 pb-12 pt-8 dark:border-neutral-800"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Concepts — engineering notes
            </p>
            <p className="font-mono text-[10px] text-neutral-300 dark:text-neutral-600">
              {total} notes
            </p>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
