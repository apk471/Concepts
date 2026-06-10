type IconProps = { category: string; className?: string };

// Small line icon shown next to a note title. Uses currentColor so it
// inherits hover/dark colors from the card.
export function CategoryIcon({ category, className }: IconProps) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (category) {
    case "system-design":
      // connected nodes
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.2" />
          <circle cx="18" cy="6" r="2.2" />
          <circle cx="12" cy="18" r="2.2" />
          <path d="M7.6 7.6 10.6 16M16.4 7.6 13.4 16M8 6h8" />
        </svg>
      );
    case "devops":
      // container / box stack
      return (
        <svg {...common}>
          <rect x="3" y="9" width="6" height="6" rx="1" />
          <rect x="10" y="9" width="6" height="6" rx="1" />
          <rect x="6.5" y="3" width="6" height="5" rx="1" />
          <path d="M17 12h4M19 10v4" />
        </svg>
      );
    case "ideas":
      // lightbulb
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.7v.5h5.4v-.5c0-.6.3-1.2.9-1.7A6 6 0 0 0 12 3Z" />
        </svg>
      );
    default:
      // document
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4M9 12h6M9 16h6" />
        </svg>
      );
  }
}
