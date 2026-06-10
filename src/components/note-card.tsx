"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Note } from "@/lib/notes";
import { CategoryIcon } from "./category-icon";
import { CardIllustration } from "./card-illustration";

export function NoteCard({ note, index }: { note: Note; index: number }) {
  return (
    <Link href={`/${note.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:shadow-black/30"
      >
        {/* Illustration */}
        <div className="flex w-full items-center justify-center border-b border-neutral-100 bg-neutral-50 px-6 pb-4 pt-6 dark:border-neutral-800 dark:bg-neutral-950/40">
          <CardIllustration category={note.category} />
        </div>

        <div className="flex flex-1 flex-col justify-between p-6">
          {/* Tag */}
          <div className="flex items-start justify-between">
            <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {note.group ?? note.categoryLabel}
            </span>
          </div>

          {/* Icon + title */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 transition-colors duration-300 group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-800 dark:text-neutral-300 dark:group-hover:bg-white dark:group-hover:text-neutral-900">
              <CategoryIcon category={note.category} />
            </div>
            <h3 className="text-lg font-semibold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100">
              {note.title}
            </h3>
          </div>

          {/* Description */}
          {note.description && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {note.description}
            </p>
          )}

          {/* Arrow */}
          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors duration-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
            <span>Read note</span>
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
