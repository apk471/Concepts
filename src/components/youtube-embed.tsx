"use client";

/**
 * Embeds a YouTube video from a ```youtube fenced code block. The block body
 * can be a full URL (watch / youtu.be / embed / shorts) or a bare 11-char ID.
 */
function parseId(value: string): string | null {
  const v = value.trim();
  // Bare 11-character video ID.
  if (/^[\w-]{11}$/.test(v)) return v;

  const patterns = [
    /[?&]v=([\w-]{11})/, // watch?v=ID
    /youtu\.be\/([\w-]{11})/, // youtu.be/ID
    /\/embed\/([\w-]{11})/, // /embed/ID
    /\/shorts\/([\w-]{11})/, // /shorts/ID
  ];
  for (const re of patterns) {
    const m = v.match(re);
    if (m) return m[1];
  }
  return null;
}

export function YouTubeEmbed({ value }: { value: string }) {
  const id = parseId(value);

  if (!id) {
    // Couldn't parse — fall back to a plain link so the content isn't lost.
    return (
      <a href={value.trim()} target="_blank" rel="noopener noreferrer">
        {value.trim()}
      </a>
    );
  }

  return (
    <div className="not-prose relative my-6 aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="YouTube video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
