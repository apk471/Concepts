"use client";

import { useEffect, useState } from "react";
import { requestTTS } from "@/lib/tts";

interface Anchor {
  top: number;
  left: number;
  text: string;
}

// Shows a small floating "Read selection" button whenever the user selects
// text, so they can have just that section read aloud.
export function SelectionReader() {
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  useEffect(() => {
    function update() {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!sel || sel.isCollapsed || text.length < 2) {
        setAnchor(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        setAnchor(null);
        return;
      }
      const left = Math.min(
        Math.max(rect.left + rect.width / 2, 80),
        window.innerWidth - 80,
      );
      setAnchor({ top: Math.max(rect.top - 44, 8), left, text });
    }

    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, true);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  if (!anchor) return null;

  return (
    <button
      // Keep the selection alive through the click.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        requestTTS(anchor.text, "Selection");
        setAnchor(null);
        window.getSelection()?.removeAllRanges();
      }}
      aria-label="Read selection aloud"
      style={{ top: anchor.top, left: anchor.left }}
      className="fixed z-[95] -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-lg transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
      Read selection
    </button>
  );
}
