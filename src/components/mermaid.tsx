"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useIsDark } from "@/hooks/use-is-dark";

/**
 * Renders a Mermaid diagram from a ```mermaid fenced code block.
 *
 * `mermaid` is large (~500KB) and touches `window`/`document`, so it is
 * dynamically imported inside the effect — never at module scope. This keeps it
 * out of the main bundle (loaded only on pages that contain a diagram) and
 * avoids `window is not defined` during SSR/build.
 */
export function Mermaid({ chart }: { chart: string }) {
  const reactId = useId().replace(/[:]/g, "");
  const isDark = useIsDark();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        // securityLevel "loose" is required for `click` directives (clickable
        // concept maps). Content is the author's own, so this is acceptable.
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isDark ? "dark" : "default",
        });

        const { svg, bindFunctions } = await mermaid.render(
          `mmd-${reactId}`,
          chart,
        );
        if (cancelled || !containerRef.current) return;

        setError(null);
        containerRef.current.innerHTML = svg;
        // Required for `click` directives to attach their handlers/links.
        bindFunctions?.(containerRef.current);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, isDark, reactId]);

  if (error) {
    return (
      <div className="my-6">
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t render diagram: {error}
        </p>
        <pre>
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-diagram my-6 flex justify-center" />;
}
