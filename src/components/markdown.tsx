"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Mermaid } from "@/components/mermaid";
import { YouTubeEmbed } from "@/components/youtube-embed";

// Notes are the author's own (trusted) content, so we intentionally enable
// rehype-raw (literal HTML like <details>) WITHOUT rehype-sanitize. Do not feed
// untrusted content through this pipeline.
const components: Components = {
  code({ className, children, ...props }: ComponentPropsWithoutRef<"code">) {
    const lang = /language-(\w+)/.exec(className ?? "")?.[1];
    const value = String(children).replace(/\n$/, "");

    if (lang === "mermaid") return <Mermaid chart={value} />;
    if (lang === "youtube") return <YouTubeEmbed value={value} />;

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // rehypeRaw must run before rehypeHighlight so raw HTML nodes are
      // materialized before syntax highlighting walks the tree.
      rehypePlugins={[
        rehypeRaw,
        [rehypeHighlight, { detect: true, ignoreMissing: true }],
      ]}
      components={components}
    >
      {source}
    </ReactMarkdown>
  );
}
