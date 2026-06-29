// Resolve a visual key for a note from keywords in its slug/title, so each
// topic gets its own illustration. Falls back to a per-category default.
export function resolveIcon(slug: string, title: string, category: string): string {
  const t = `${slug} ${title}`.toLowerCase();

  const rules: [RegExp, string][] = [
    [/web[- ]?crawl|crawler|spider|url[- ]?frontier/, "crawler"],
    [/capacity|qps|throughput|estimat/, "capacity"],
    [/message[- ]?queue|kafka|rabbit|\bqueue/, "queue"],
    [/pub[- ]?sub|publish|subscrib|broadcast/, "pubsub"],
    [/stateless|stateful|\bstate\b|session/, "state"],
    [/worker|background job|async task/, "workers"],
    [/architecture|high[- ]?level|cdn|load[- ]?balanc/, "architecture"],
    [/interview|framework/, "framework"],
    [/ci[\/-]?cd|pipeline|deploy/, "pipeline"],
    [/docker|container|image/, "container"],
    [/github|actions|workflow/, "actions"],
    [/home[- ]?server|self[- ]?host|\bserver\b|rack/, "server"],
    [/notes?[- ]?site|\bweb\b|website|frontend/, "web"],
    [/1001x|rocket|growth|scal(e|ing)/, "rocket"],
    [/slack|chat|message\b|notif/, "chat"],
    [/setup|config|install|tooling|\btools?\b/, "tools"],
    [/\bneed\b|todo|checklist|\blist\b|requirement/, "list"],
  ];

  for (const [re, key] of rules) {
    if (re.test(t)) return key;
  }

  switch (category) {
    case "system-design":
      return "architecture";
    case "devops":
      return "container";
    case "ideas":
      return "idea";
    default:
      return "doc";
  }
}
