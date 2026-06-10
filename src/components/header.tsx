"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  function openSearch() {
    window.dispatchEvent(new Event("open-search"));
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <circle cx="16" cy="16" r="7.5" />
              <line x1="16" y1="4.5" x2="16" y2="27.5" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Concepts
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <button
            onClick={openSearch}
            className="mr-1 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:text-neutral-300"
            aria-label="Search notes"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded bg-neutral-200 px-1.5 font-mono text-[10px] text-neutral-500 sm:inline dark:bg-neutral-800 dark:text-neutral-400">
              ⌘K
            </kbd>
          </button>
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            Notes
          </Link>
          <Link
            href="/about"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </motion.header>
  );
}
