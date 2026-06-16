"use client";

import { requestTTS } from "@/lib/tts";

// Triggers the global TTSPlayer to read this note aloud. The player captures
// the text into its own state, so playback continues even after navigating away.
export function ListenButton({ title, text }: { title: string; text: string }) {
  return (
    <button
      onClick={() => requestTTS(text, title)}
      aria-label="Listen to this note"
      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:text-neutral-200"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
      Listen
    </button>
  );
}
