type Props = { name: string };

// Abstract monochrome illustration per visual key (see lib/note-visual.ts).
// Stroke uses currentColor, set to a muted neutral by the card.
export function CardIllustration({ name }: Props) {
  const common = {
    viewBox: "0 0 200 90",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[88px] w-full text-neutral-300 dark:text-neutral-700",
  };

  switch (name) {
    case "capacity":
      // gauge arc + needle + bars
      return (
        <svg {...common}>
          <path d="M60 60a40 40 0 0 1 80 0" />
          <path d="M100 60 78 36" />
          <circle cx="100" cy="60" r="3.5" />
          <path d="M64 60h-3M100 22v3M136 60h3" />
          <path d="M150 64v-8M160 64v-16M170 64v-24" />
        </svg>
      );
    case "queue":
      // boxes lining up into a consumer
      return (
        <svg {...common}>
          <rect x="24" y="34" width="20" height="20" rx="2" />
          <rect x="50" y="34" width="20" height="20" rx="2" />
          <rect x="76" y="34" width="20" height="20" rx="2" />
          <path d="M100 44h44" />
          <path d="M138 40l6 4-6 4" />
          <circle cx="164" cy="44" r="11" />
        </svg>
      );
    case "pubsub":
      // one publisher fanning out to subscribers
      return (
        <svg {...common}>
          <circle cx="38" cy="45" r="10" />
          <path d="M48 45h22M70 45 96 24M70 45l26 21" />
          <rect x="98" y="14" width="22" height="18" rx="2" />
          <rect x="98" y="36" width="22" height="18" rx="2" />
          <rect x="98" y="58" width="22" height="18" rx="2" />
          <path d="M70 45h28" />
        </svg>
      );
    case "state":
      // database cylinder + toggle
      return (
        <svg {...common}>
          <ellipse cx="56" cy="28" rx="22" ry="7" />
          <path d="M34 28v34c0 3.9 9.8 7 22 7s22-3.1 22-7V28" />
          <path d="M34 45c0 3.9 9.8 7 22 7s22-3.1 22-7" />
          <rect x="116" y="38" width="44" height="20" rx="10" />
          <circle cx="150" cy="48" r="7" />
        </svg>
      );
    case "workers":
      // dispatcher to parallel workers
      return (
        <svg {...common}>
          <rect x="22" y="36" width="22" height="18" rx="2" />
          <path d="M44 45h20M64 45 88 24M64 45l24 21M64 45h24" />
          <circle cx="100" cy="20" r="9" />
          <circle cx="100" cy="45" r="9" />
          <circle cx="100" cy="70" r="9" />
          <path d="M100 14v-3M100 76v3" />
        </svg>
      );
    case "architecture":
      // tiered: client -> LB -> servers -> DB
      return (
        <svg {...common}>
          <circle cx="28" cy="45" r="9" />
          <path d="M37 45h14" />
          <path d="M51 39h16v12H51z" />
          <path d="M67 45 92 30M67 45l25 30" />
          <rect x="92" y="22" width="22" height="16" rx="2" />
          <rect x="92" y="52" width="22" height="16" rx="2" />
          <path d="M114 30h16M114 60h16" />
          <ellipse cx="150" cy="45" rx="16" ry="6" />
          <path d="M134 45v0M166 45v0M134 45c0 3.3 7.2 6 16 6s16-2.7 16-6" />
        </svg>
      );
    case "framework":
      // numbered steps
      return (
        <svg {...common}>
          <circle cx="40" cy="30" r="8" />
          <circle cx="40" cy="60" r="8" />
          <path d="M40 38v14" />
          <path d="M56 30h90M56 60h70" />
          <path d="M56 26h60M56 64h50" />
        </svg>
      );
    case "pipeline":
      // CI/CD stages with arrows
      return (
        <svg {...common}>
          <circle cx="34" cy="45" r="10" />
          <path d="M44 45h18l5-5 5 5h18" />
          <rect x="82" y="35" width="20" height="20" rx="2" />
          <path d="M102 45h18" />
          <path d="M114 41l6 4-6 4" />
          <circle cx="134" cy="45" r="10" />
          <path d="M148 45h18" />
          <path d="M160 41l6 4-6 4" />
        </svg>
      );
    case "container":
      // stacked containers
      return (
        <svg {...common}>
          <rect x="24" y="30" width="34" height="30" rx="3" />
          <rect x="83" y="30" width="34" height="30" rx="3" />
          <rect x="142" y="30" width="34" height="30" rx="3" />
          <path d="M58 45h25M117 45h25" />
          <path d="M30 38h12M30 44h18M89 38h12M89 44h18M148 38h12M148 44h18" />
        </svg>
      );
    case "actions":
      // workflow nodes + run trigger
      return (
        <svg {...common}>
          <circle cx="34" cy="45" r="9" />
          <path d="M30 45l4-4 0 8z" fill="currentColor" stroke="none" />
          <path d="M43 45h17M76 45h17M109 45h17" />
          <circle cx="68" cy="45" r="8" />
          <circle cx="101" cy="45" r="8" />
          <rect x="126" y="36" width="40" height="18" rx="3" />
          <path d="M134 45h24" />
        </svg>
      );
    case "server":
      // server rack with status dots
      return (
        <svg {...common}>
          <rect x="64" y="20" width="72" height="50" rx="4" />
          <path d="M64 36h72M64 53h72" />
          <circle cx="74" cy="28" r="2" />
          <circle cx="74" cy="44.5" r="2" />
          <circle cx="74" cy="61.5" r="2" />
          <path d="M118 26h10M118 43h10M118 60h10" />
        </svg>
      );
    case "web":
      // browser window
      return (
        <svg {...common}>
          <rect x="50" y="20" width="100" height="50" rx="4" />
          <path d="M50 32h100" />
          <circle cx="58" cy="26" r="1.6" />
          <circle cx="64" cy="26" r="1.6" />
          <circle cx="70" cy="26" r="1.6" />
          <path d="M60 44h40M60 52h60M60 60h28" />
        </svg>
      );
    case "rocket":
      // rocket + motion
      return (
        <svg {...common}>
          <path d="M96 58c-14-8-12-30 8-42 20 12 22 34 8 42l-4 6h-8z" />
          <circle cx="108" cy="34" r="4" />
          <path d="M96 58l-8 10 10-4M120 58l8 10-10-4" />
          <path d="M60 30h14M52 45h18M60 60h14" />
        </svg>
      );
    case "chat":
      // speech bubbles
      return (
        <svg {...common}>
          <path d="M58 28h54a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H82l-12 10v-10h-6a6 6 0 0 1-6-6V34a6 6 0 0 1 6-6z" />
          <path d="M72 40h28M72 48h20" />
          <path d="M128 40h14a6 6 0 0 1 6 6v14l-8-6h-12a6 6 0 0 1-6-6" />
        </svg>
      );
    case "tools":
      // wrench + gear
      return (
        <svg {...common}>
          <circle cx="78" cy="45" r="13" />
          <circle cx="78" cy="45" r="5" />
          <path d="M78 28v-5M78 67v-5M61 45h-5M100 45h-5M66 33l-4-4M94 61l4 4M66 57l-4 4M94 29l4-4" />
          <path d="M116 60l18-18a8 8 0 1 0-10-10l-18 18 4 6z" />
        </svg>
      );
    case "list":
      // checklist
      return (
        <svg {...common}>
          <rect x="62" y="20" width="14" height="14" rx="3" />
          <path d="M66 27l3 3 5-6" />
          <rect x="62" y="42" width="14" height="14" rx="3" />
          <rect x="62" y="58" width="0.1" height="0.1" />
          <path d="M86 27h52M86 49h44M86 64h52" />
        </svg>
      );
    case "idea":
      // lightbulb
      return (
        <svg {...common}>
          <path d="M100 22a20 20 0 0 0-12 36c2 1.6 3 3.6 3 5.8v2h18v-2c0-2.2 1-4.2 3-5.8A20 20 0 0 0 100 22Z" />
          <path d="M91 70h18M94 76h12" />
          <path d="M100 8v6M70 22l4 4M130 22l-4 4M58 45h6M136 45h6" />
        </svg>
      );
    case "loop":
      // circular feedback loop: read → plan → implement → test → back
      return (
        <svg {...common}>
          <path d="M64 32a30 30 0 0 1 54-6" />
          <path d="M118 18v12h-12" />
          <path d="M136 58a30 30 0 0 1-54 6" />
          <path d="M82 78V66h12" />
          <circle cx="64" cy="32" r="3" />
          <circle cx="118" cy="26" r="3" />
          <circle cx="136" cy="58" r="3" />
          <circle cx="82" cy="64" r="3" />
        </svg>
      );
    case "crawler":
      // spider-web crawl: central node + radiating links to page nodes
      return (
        <svg {...common}>
          <circle cx="100" cy="45" r="10" />
          <circle cx="50" cy="20" r="6" />
          <circle cx="160" cy="20" r="6" />
          <circle cx="40" cy="60" r="6" />
          <circle cx="170" cy="60" r="6" />
          <circle cx="100" cy="78" r="6" />
          <path d="M91 41 56 22M109 41 154 22M93 51 46 60M107 51 164 60M100 55v17" />
          <path d="M50 26v28M160 26v28" />
        </svg>
      );
    case "notification":
      // bell + radiating waves + small badge dot
      return (
        <svg {...common}>
          <path d="M86 60V42a14 14 0 0 1 28 0v18l4 6H82z" />
          <path d="M94 70a6 6 0 0 0 12 0" />
          <path d="M70 30c2-4 5-7 9-9M70 60c2 4 5 7 9 9M130 30c-2-4-5-7-9-9M130 60c-2 4-5 7-9 9" />
          <circle cx="124" cy="30" r="6" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      // document
      return (
        <svg {...common}>
          <path d="M76 18h32l16 16v38H76z" />
          <path d="M108 18v16h16" />
          <path d="M84 44h32M84 52h32M84 60h20" />
        </svg>
      );
  }
}
