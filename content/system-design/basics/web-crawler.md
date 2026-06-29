# Designing a Web Crawler

A web crawler is a system that systematically downloads pages from the internet, extracts their content and links, and feeds them into downstream systems — search engines, archives (Wayback Machine), data mining pipelines, and SEO tools all sit on top of a crawler.

The interesting part of the design is not "fetch a URL." It's how to do that **billions of times** without melting target sites, re-downloading the same page forever, or letting one slow host stall the whole fleet.

---

## Brief

Common use cases:

- **Search engine indexing** — Googlebot, Bingbot
- **Web archiving** — Internet Archive
- **Price / availability monitoring** — e-commerce comparison sites
- **Training data collection** — LLM datasets
- **SEO and link analysis** — Ahrefs, Semrush

Inputs the design needs to specify:

- Scale: how many pages, how often, how fresh
- Scope: whole web vs. one domain vs. a vertical (news, jobs)
- Politeness budget per host
- Storage budget for HTML + metadata
- Update / refresh strategy

---

## High-Level Design

```text
        ┌──────────────┐
        │ Seed URLs    │
        └──────┬───────┘
               ↓
        ┌──────────────┐
        │ URL Frontier │←─────────────────────────────────────┐
        └──────┬───────┘                                      │
               ↓                                              │
        ┌──────────────┐    ┌──────────────┐                  │
        │ DNS Resolver │───→│ HTML         │                  │
        └──────────────┘    │ Downloader   │                  │
                            └──────┬───────┘                  │
                                   ↓                          │
                            ┌──────────────┐                  │
                            │ Content      │                  │
                            │ Parser       │                  │
                            └──────┬───────┘                  │
                                   ↓                          │
                       ┌───────────────────────┐              │
                       │ Content Seen?         │              │
                       │ (hash already known?) │              │
                       └────┬──────────┬───────┘              │
                       no   │          │ yes → drop           │
                            ↓                                 │
                     ┌──────────────┐                         │
                     │ Storage      │ (HTML + metadata)       │
                     └──────┬───────┘                         │
                            ↓                                 │
                     ┌──────────────┐                         │
                     │ Link         │                         │
                     │ Extractor    │                         │
                     └──────┬───────┘                         │
                            ↓                                 │
                     ┌──────────────┐                         │
                     │ URL Filter   │ (allowlist / disallow,  │
                     └──────┬───────┘  scheme, file types,    │
                            ↓          robots.txt)            │
                     ┌──────────────┐                         │
                     │ URL Seen?    │                         │
                     │ (visited or  │                         │
                     │  enqueued?)  │                         │
                     └────┬──────┬──┘                         │
                     no   │      │ yes → drop                 │
                          └──────┴─────────────────────────────┘
                            new URLs back into Frontier
```

### Pipeline at a glance

| Stage | Job |
| --- | --- |
| **Seed URLs** | Initial entry points; the frontier starts here |
| **URL Frontier** | Prioritized, polite queue of URLs to fetch |
| **DNS Resolver** | Hostname → IP; heavy cache to avoid repeat lookups |
| **HTML Downloader** | Fetches the page, respects timeouts/retries |
| **Content Parser** | Validates and normalizes HTML; strips boilerplate |
| **Content Seen?** | De-dupes near-identical pages by content hash |
| **Link Extractor** | Pulls all `<a href>` URLs from the parsed page |
| **URL Filter** | Drops disallowed schemes, file types, hosts, paths |
| **URL Seen?** | De-dupes URLs we've already enqueued/fetched |

The whole thing is one giant **producer-consumer loop**: extracted URLs feed back into the frontier, and the frontier feeds the downloader. Stop conditions are usually "the frontier is empty" (small crawls) or "we hit the budget" (large crawls).

---

## Capacity (back-of-envelope)

For a search-engine-scale crawl:

- Target: 1 B pages crawled per month
- = ~400 pages/sec sustained
- Avg page size after compression: ~100 KB → ~100 MB/sec write throughput, ~3 PB/month raw HTML
- Active URL frontier: tens of billions of URLs (most stored on disk, not RAM)
- URL-seen set: bloom filter + on-disk store for billions of keys

This is why every component below has a "scale-out" story; one machine isn't enough for anything.

---

## Low-Level Design

### URL Frontier

The frontier is **not** a single FIFO queue. It has two competing requirements:

1. **Prioritization** — important URLs (high PageRank, news sites, frequently changing pages) should be fetched before low-value pages.
2. **Politeness** — never hit the same host with more than one concurrent request, and respect crawl-delay.

Mercator's classic design splits the frontier into **two queue tiers**:

```text
                ┌──────────────────┐
   new URLs →   │ Front Queues     │   ← prioritization layer
                │ F1 F2 F3 ... Fn  │   (one queue per priority)
                └────────┬─────────┘
                         ↓
              ┌──────────────────────┐
              │ Queue Selector       │   pulls from front by priority
              └──────────┬───────────┘
                         ↓
                ┌──────────────────┐
                │ Back Queues      │   ← politeness layer
                │ B1 B2 B3 ... Bm  │   (one queue per host)
                └────────┬─────────┘
                         ↓
              ┌──────────────────────┐
              │ Heap of "next-time"  │   one entry per back queue
              │ for each back queue  │
              └──────────┬───────────┘
                         ↓
                    Downloader
```

- **Front queues** sort by priority. Higher-priority URLs flow downstream faster.
- **Back queues** are keyed by host: each host has exactly one back queue, so only one URL per host is in flight.
- A **min-heap** keyed by `next-fetch-time` per back queue gives the next URL the downloader is allowed to touch.

### HTML Downloader

A pool of worker processes that pull from the frontier, fetch HTML, and emit raw responses.

Important properties:

- **Concurrency per host = 1.** Concurrency across hosts is high (hundreds–thousands of workers).
- **Timeouts** — connect timeout, read timeout, and a hard total timeout. Without these, one dead site stalls a worker forever.
- **Retries** with exponential backoff for 5xx and connection errors. Give up after N tries.
- **User-Agent** — identifies the bot ("Googlebot/2.1 (+http://www.google.com/bot.html)"). Required for transparency and so sites can allow/block you.
- **HTTPS** — required for most modern sites; verify certs.
- **Compression** — accept `gzip`/`br` to save bandwidth.
- **Distributed** — workers run on many machines, often grouped by geography to reduce latency to target sites.

### DNS Resolver

DNS is a deceptively heavy dependency. Every page = at least one DNS lookup. At 400 pages/sec, that's 400 DNS queries/sec — most of them for hosts you've already resolved minutes ago.

Design:

- **Local DNS cache** in front of the resolver, keyed by hostname
- TTL respected, but capped (e.g., min 60s, max 1h)
- Negative caching: remember `NXDOMAIN` results so we don't re-query dead hosts
- **Pre-resolution** — a background job warms the cache for hosts that are about to be popped from the frontier

Without caching, your crawler is a DoS attack on your DNS resolver.

### Content Parser

Takes the raw HTML response and turns it into something downstream stages can use:

- Validate that the response is actually HTML (Content-Type, not a 1 GB binary)
- Detect and convert character encoding to UTF-8
- Strip scripts, style, ads — keep the visible text and the link skeleton
- Reject malformed pages early instead of letting them propagate

Often runs in a sandbox / size-limited environment because real-world HTML is hostile.

### Content Seen?

Pages get duplicated all over the web:

- Mirror sites (`example.com` and `www.example.com`)
- Print versions, mobile versions, AMP versions
- Boilerplate content with one changed paragraph

You don't want to index the same content twice. Solution: **content fingerprinting**.

- Compute a hash over the normalized content (e.g., SimHash, MinHash, or just SHA-256 of the cleaned text)
- Maintain a set of seen fingerprints
- If the new fingerprint matches an existing one, drop the page

SimHash is preferred over plain hashing because it allows **near-duplicate** detection (e.g., same article, different ads).

### Link Extractor

Walks the parsed DOM and pulls out URLs:

- `<a href>`, `<link href>`, sometimes `<img src>` for image crawls
- Resolve **relative URLs** against the page's base URL
- Normalize: lowercase scheme/host, strip default ports (`:80`/`:443`), strip URL fragments (`#section`), sort query params alphabetically, remove session-id parameters

URL normalization matters a lot for the URL-seen check: `https://Example.com/Path?b=1&a=2#top` and `https://example.com/Path?a=2&b=1` are the same URL, and treating them differently doubles your crawl.

### URL Filter

A series of cheap checks that drop URLs before they're enqueued. Examples:

- **Scheme allowlist** — only `http` / `https`
- **File-type denylist** — `.zip`, `.exe`, `.mp4`, `.iso` (unless you specifically want them)
- **Host allowlist/denylist** — corporate blocklists, parental controls
- **Path denylist** — `/logout`, `/checkout`, infinite calendars (`?date=...`)
- **robots.txt** check — disallowed by the host (covered below)
- **URL length / parameter count limit** — defends against malformed URLs

Filtering at this stage is much cheaper than fetching and then discarding.

### URL Seen?

Before enqueueing a URL, check whether you've already fetched or enqueued it. At billions of URLs, an in-memory hash set is out of the question.

Two-tier design:

1. **Bloom filter** in RAM — fast probabilistic "definitely not seen" check. A 64 GB bloom filter handles tens of billions of URLs with low false-positive rate.
2. **Persistent store** behind it — for the (rare) bloom hits, check an actual disk-backed key-value store (RocksDB, Bigtable, S3 + index).

False positives in the bloom filter just mean we skip a URL we hadn't actually seen — usually acceptable. False negatives are impossible.

---

## Prioritization

Not every URL is equally worth fetching. Heuristics that drive priority:

| Signal | Why it raises priority |
| --- | --- |
| **PageRank / authority** | High-link-count pages are seeds for more high-quality content |
| **Update frequency** | News, social media, status pages change every minute |
| **User demand** | Pages people actually search for |
| **Recency** | Recently crawled = lower priority; stale = higher |
| **Domain trust** | `.gov`, `.edu`, known-good hosts get higher priority |
| **Topic value** | Topic-specific crawlers prioritize the relevant vertical |

The frontier's **front queues** are typically `F1` (highest) through `Fn` (lowest), with the queue selector weighted toward higher priority but still occasionally pulling from lower queues so they don't starve.

Recrawl scheduling is its own problem — a `nytimes.com/article/...` might warrant a recrawl every hour, while `oldblog.example.com/post/...` only needs one every month.

---

## Politeness

A crawler that hits one host 100 times per second is indistinguishable from a DoS attack. Politeness is a hard requirement, not a nice-to-have.

Rules:

- **One outstanding request per host.** Even if 50 of your worker machines all have URLs from the same domain, only one fetches at a time.
- **Crawl delay** between requests to the same host — default 1–5 seconds; longer for small sites; honor `Crawl-Delay` directives in robots.txt.
- **Bandwidth cap** per host — total bytes-per-second ceiling so you don't drown small hosts even within delay limits.
- **Time-of-day awareness** — back off during the host's peak hours if you can detect them.

This is enforced by the frontier's back queues + per-host next-fetch-time heap. Politeness is *baked into the data structures*, not added as an afterthought.

---

## robots.txt

The de facto protocol that lets sites tell crawlers what they may and may not fetch. Lives at `https://example.com/robots.txt`.

Example:

```text
User-agent: *
Disallow: /private/
Disallow: /search
Crawl-Delay: 5

User-agent: Googlebot
Allow: /

Sitemap: https://example.com/sitemap.xml
```

Crawler responsibilities:

1. **Fetch `robots.txt` once per host**, cache the result (commonly 24 h).
2. Parse the rules for *our* User-Agent.
3. **Refuse to enqueue** any URL the rules disallow.
4. Honor `Crawl-Delay` in the politeness layer.
5. Use `Sitemap:` entries as additional seed URLs.

Edge cases:

- `robots.txt` missing → assume "allowed."
- `robots.txt` returns 5xx → back off and treat as "disallowed" until it comes back, or fall back to a cached copy.
- `robots.txt` larger than ~500 KB → ignore (RFC 9309 limit).

Robots is **advisory**, but a public bot that ignores it gets blocked and shamed quickly. Respect it.

---

## Caches

Caching is everywhere in this design. Roll them up:

| Cache | What it stores | Why |
| --- | --- | --- |
| **DNS cache** | hostname → IP | Avoid hammering DNS for every page |
| **robots.txt cache** | host → parsed rules | One fetch per host per ~24 h |
| **URL-seen bloom + KV** | URL fingerprint → bit/row | Fast dedup at billions of URLs |
| **Content-seen set** | content fingerprint → bool | Dedup near-duplicate pages |
| **Page cache** | URL → raw HTML + headers | Re-parse / recrawl decisions without refetch |
| **Connection pool** | host → live TCP / TLS sessions | Skip handshake on repeat fetches to the same host |

Layering caches dramatically reduces network calls, which is the dominant cost in a crawler.

---

## Storage

Two main stores, both designed for sequential append + occasional random read:

- **Raw HTML store** — blob storage (S3, HDFS, GFS). Keyed by URL hash. Compressed.
- **Metadata store** — KV/columnar (Bigtable, Cassandra). Stores: last-crawled timestamp, status code, response size, content fingerprint, links extracted, robots.txt cache, etc.

Sharding is by URL hash. Replication for durability — losing crawled data means refetching, which is the most expensive thing the crawler does.

---

## Distributed Architecture

A real crawler runs on many machines:

- **Frontier** is sharded by host (so a single host's back queue lives on one node — enforces single-request-per-host)
- **Downloaders** are stateless workers, hundreds to thousands
- **Parsers** are stateless; CPU bound, so scaled independently from downloaders
- **Storage** is its own cluster
- A coordinator handles seeds, scheduling, and dead-machine recovery

```text
   Coordinator
        │
        ├── Frontier shard 1 ──┐
        ├── Frontier shard 2 ──┤
        ├── Frontier shard N ──┤
        │                      ↓
        │                Worker pool  ──→ Parser pool ──→ Storage
        │                      ↑                              │
        │                      └──────── new URLs ←───────────┘
        │
        └── DNS / robots.txt cache (shared)
```

---

## Common Failure Modes

| Failure | Symptom | Fix |
| --- | --- | --- |
| Spider trap (infinite calendar, infinite redirects) | Frontier explodes with one host's URLs | Per-host URL count cap; depth limit |
| Crawler loop (page A links to B links to A) | Same URLs re-fetched forever | URL-seen check |
| Slow host | Workers stalled on one domain | Per-host concurrency = 1, aggressive timeouts |
| Misconfigured target site | 500s everywhere | Backoff + circuit breaker per host |
| Cloaking | Site serves different content to bots vs. users | Compare with a real-browser fetch periodically |
| Bandwidth explosion | One host serves multi-GB pages | Per-page byte cap; reject huge `Content-Length` early |

---

## Backend Best Practices

- Make every component **stateless** where possible — frontier and storage are the only stateful pieces.
- Treat **politeness and robots.txt as non-negotiable**; failing them gets your bot blocked, not "slowed down."
- Cache aggressively: DNS, robots.txt, connections.
- Use **bloom filters** for any "have we seen this?" question at scale.
- Normalize URLs **before** any seen check; it's the single biggest correctness lever.
- Log everything per request — when something gets banned, you'll need the audit trail.
- Plan for the **recrawl** problem from day one, not as a follow-up project.

---

## Quick Comparison: Web Crawler vs. Web Scraper

| | Crawler | Scraper |
| --- | --- | --- |
| Scope | Many sites, broad | One site, deep |
| Discovery | Follows links | Hits known URLs |
| Politeness | Crucial | Crucial (same host) |
| robots.txt | Must honor | Should honor |
| Output | Indexed content + links | Structured rows |
| Examples | Googlebot, Bingbot | Price-monitoring bot |

Crawlers discover. Scrapers exploit known structure.
