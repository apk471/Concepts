import type { MetadataRoute } from "next";
import { getAllNotes } from "@/lib/notes";

const base = "https://concepts-notes.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const notes = getAllNotes().map((n) => ({
    url: `${base}/${n.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...notes,
  ];
}
