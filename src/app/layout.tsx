import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CommandMenu } from "@/components/command-menu";
import { getSearchIndex } from "@/lib/notes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const siteUrl = "https://concept-pi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Concepts",
    template: "%s — Concepts",
  },
  description:
    "Engineering notes on DevOps, system design, and ideas — collected, organized, and searchable.",
  keywords: [
    "engineering notes",
    "devops",
    "system design",
    "docker",
    "ci/cd",
    "message queues",
    "capacity planning",
    "concepts",
  ],
  openGraph: {
    type: "website",
    siteName: "Concepts",
    title: "Concepts",
    description:
      "Engineering notes on DevOps, system design, and ideas — collected, organized, and searchable.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Concepts",
    description:
      "Engineering notes on DevOps, system design, and ideas — collected, organized, and searchable.",
  },
  robots: { index: true, follow: true },
};

// Set the theme class before first paint to avoid a flash.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        {children}
        <CommandMenu entries={getSearchIndex()} />
      </body>
    </html>
  );
}
