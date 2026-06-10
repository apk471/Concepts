import Link from "next/link";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-neutral-950">
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col items-start px-6 py-32">
        <p className="font-mono text-sm text-neutral-400">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
          Note not found
        </h1>
        <p className="mt-3 text-base text-neutral-500 dark:text-neutral-400">
          That page doesn’t exist or may have been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          All notes
        </Link>
      </main>
    </div>
  );
}
