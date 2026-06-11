"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether dark mode is active by observing the `dark` class on
 * <html>. The theme toggle (theme-toggle.tsx) flips that class and exposes no
 * context, so observing the class directly is the lowest-coupling way for
 * components like <Mermaid> to react to theme changes.
 *
 * Starts `false` until mounted (matching theme-toggle's pattern) so the server
 * and first client render agree.
 */
export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
