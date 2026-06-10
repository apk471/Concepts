type IconProps = { name: string; className?: string };

// Small line icon shown next to a note title, keyed to the same visual as the
// card illustration (see lib/note-visual.ts). Uses currentColor.
export function CategoryIcon({ name, className }: IconProps) {
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

  switch (name) {
    case "capacity":
      return (
        <svg {...common}>
          <path d="M5 17a7 7 0 0 1 14 0" />
          <path d="M12 17 9 11" />
          <circle cx="12" cy="17" r="1.2" />
        </svg>
      );
    case "queue":
      return (
        <svg {...common}>
          <rect x="3" y="9" width="4" height="6" rx="1" />
          <rect x="8" y="9" width="4" height="6" rx="1" />
          <path d="M13 12h5" />
          <path d="M16 10l2 2-2 2" />
          <circle cx="20.5" cy="12" r="1.3" />
        </svg>
      );
    case "pubsub":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.2" />
          <path d="M7 12h3M10 12 16 6M10 12l6 6M10 12h6" />
          <rect x="16" y="4.5" width="4" height="3.5" rx="0.8" />
          <rect x="16" y="10" width="4" height="3.5" rx="0.8" />
          <rect x="16" y="15.5" width="4" height="3.5" rx="0.8" />
        </svg>
      );
    case "state":
      return (
        <svg {...common}>
          <ellipse cx="8" cy="6" rx="4.5" ry="1.8" />
          <path d="M3.5 6v10c0 1 2 1.8 4.5 1.8s4.5-.8 4.5-1.8V6" />
          <path d="M3.5 11c0 1 2 1.8 4.5 1.8s4.5-.8 4.5-1.8" />
          <rect x="15" y="13" width="7" height="4" rx="2" />
        </svg>
      );
    case "workers":
      return (
        <svg {...common}>
          <rect x="2.5" y="10" width="4" height="4" rx="1" />
          <path d="M6.5 12h2M8.5 12 13 7M8.5 12 13 17M8.5 12H13" />
          <circle cx="15.5" cy="6.5" r="1.8" />
          <circle cx="15.5" cy="12" r="1.8" />
          <circle cx="15.5" cy="17.5" r="1.8" />
        </svg>
      );
    case "architecture":
      return (
        <svg {...common}>
          <circle cx="5" cy="6" r="2" />
          <circle cx="5" cy="18" r="2" />
          <rect x="15" y="4" width="6" height="6" rx="1" />
          <rect x="15" y="14" width="6" height="6" rx="1" />
          <path d="M7 6h8M7 18h8" />
        </svg>
      );
    case "framework":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.2" />
          <circle cx="6" cy="16" r="2.2" />
          <path d="M6 8.2v5.6M11 6h9M11 16h7" />
        </svg>
      );
    case "pipeline":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.2" />
          <path d="M7 12h3M14 12h3" />
          <rect x="10" y="9.5" width="4" height="5" rx="1" />
          <path d="M17 12h3" />
          <path d="M18 10l2 2-2 2" />
        </svg>
      );
    case "container":
      return (
        <svg {...common}>
          <rect x="3" y="9" width="6" height="6" rx="1" />
          <rect x="10" y="9" width="6" height="6" rx="1" />
          <rect x="6.5" y="3" width="6" height="5" rx="1" />
          <path d="M17 12h4M19 10v4" />
        </svg>
      );
    case "actions":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.2" />
          <path d="M4.3 12l1.3-1v2z" fill="currentColor" stroke="none" />
          <path d="M7 12h3M14 12h3" />
          <circle cx="12" cy="12" r="2" />
          <rect x="17" y="10" width="4" height="4" rx="1" />
        </svg>
      );
    case "server":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="8" rx="1.5" />
          <rect x="4" y="13" width="16" height="8" rx="1.5" />
          <circle cx="7.5" cy="7" r="0.9" />
          <circle cx="7.5" cy="17" r="0.9" />
          <path d="M12 7h5M12 17h5" />
        </svg>
      );
    case "web":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
          <circle cx="6" cy="7" r="0.7" />
          <circle cx="8.5" cy="7" r="0.7" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M9 15c-3-1.8-2.6-7 2-10 4.6 3 5 8.2 2 10l-1 2H10z" />
          <circle cx="12" cy="8" r="1.2" />
          <path d="M9 15l-2 3 3-1M15 15l2 3-3-1" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M4 6h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-3 3v-3a2 2 0 0 1-1-2V8a2 2 0 0 1 2-2z" />
          <path d="M8 10h6M8 12.5h4" />
        </svg>
      );
    case "tools":
      return (
        <svg {...common}>
          <circle cx="8" cy="11" r="3.5" />
          <circle cx="8" cy="11" r="1.3" />
          <path d="M8 4.5v-1M8 18.5v-1M1.5 11h1M14.5 11h1M3.5 6.5l.8.8M12.5 15.5l.8.8" />
          <path d="M14 17l5-5a2.3 2.3 0 0 0-3-3l-5 5z" />
        </svg>
      );
    case "list":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="4" height="4" rx="1" />
          <path d="M4 6l1 1 1.5-2" />
          <rect x="3" y="12" width="4" height="4" rx="1" />
          <path d="M9 6h11M9 14h9" />
        </svg>
      );
    case "idea":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.1.9 1.7v.5h5.4v-.5c0-.6.3-1.2.9-1.7A6 6 0 0 0 12 3Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4M9 12h6M9 16h6" />
        </svg>
      );
  }
}
