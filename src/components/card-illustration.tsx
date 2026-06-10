type Props = { category: string };

// Abstract monochrome illustration for the top of each note card.
// Stroke uses currentColor (set to a muted neutral by the card).
export function CardIllustration({ category }: Props) {
  const common = {
    viewBox: "0 0 200 90",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[88px] w-full text-neutral-300 dark:text-neutral-700",
  };

  switch (category) {
    case "system-design":
      return (
        <svg {...common}>
          <circle cx="40" cy="45" r="9" />
          <circle cx="100" cy="22" r="9" />
          <circle cx="100" cy="68" r="9" />
          <circle cx="160" cy="45" r="9" />
          <path d="M49 45h6M51 41l40-14M51 49l40 14M109 22h42M109 68h42M151 26l4 14M151 64l4-14" />
        </svg>
      );
    case "devops":
      return (
        <svg {...common}>
          <rect x="24" y="30" width="34" height="30" rx="3" />
          <rect x="83" y="30" width="34" height="30" rx="3" />
          <rect x="142" y="30" width="34" height="30" rx="3" />
          <path d="M58 45h25M117 45h25" />
          <path d="M30 38h12M30 44h18M89 38h12M89 44h18M148 38h12M148 44h18" />
        </svg>
      );
    case "ideas":
      return (
        <svg {...common}>
          <path d="M100 22a20 20 0 0 0-12 36c2 1.6 3 3.6 3 5.8v2h18v-2c0-2.2 1-4.2 3-5.8A20 20 0 0 0 100 22Z" />
          <path d="M91 70h18M94 76h12" />
          <path d="M100 8v6M70 22l4 4M130 22l-4 4M58 45h6M136 45h6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="62" y="18" width="76" height="56" rx="4" />
          <path d="M74 34h52M74 44h52M74 54h34" />
        </svg>
      );
  }
}
