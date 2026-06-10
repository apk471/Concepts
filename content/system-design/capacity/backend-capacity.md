# Backend Capacity Estimation

---

## Brief

Capacity estimation is rough calculation to size your system before building it. You estimate expected traffic, then derive requirements for servers, storage, cache, database, and network.

The goal is not perfect accuracy. The goal is to be in the right ballpark and know which component will bottleneck first.

---

## Key Metrics

| Metric | Description | Unit |
| --- | --- | --- |
| DAU | Daily Active Users | users |
| MAU | Monthly Active Users | users |
| QPS | Queries Per Second | req/s |
| Peak QPS | Maximum QPS during traffic spike | req/s |
| Total Requests | Requests per day | req/day |
| Bandwidth | Data in/out per second | Mbps or Gbps |
| Storage | Total data stored | GB/TB |
| Memory | RAM needed for cache | GB |
| DB Size | Data in the database | GB/TB |
| Number of Servers | App server instances | count |

---

## Estimation Process

### Step 1: Define Assumptions

Start with known or assumed numbers:

```text
DAU: 10 million
Requests per user per day: 10
Average request size: 50 KB
Peak traffic ratio: 2x average
Read:Write ratio: 9:1
Data stored per user: 100 MB
Growth rate: 20% per year
```

### Step 2: Calculate Total Requests

```text
Total requests per day = DAU × requests/user/day
                       = 10,000,000 × 10
                       = 100,000,000 req/day
```

### Step 3: Calculate Average QPS

```text
Average QPS = Total requests per day / seconds per day
            = 100,000,000 / 86,400
            ≈ 1,157 req/s
```

### Step 4: Calculate Peak QPS

Assume peak is 2-3x average (depends on traffic pattern).

```text
Peak QPS = Average QPS × peak factor
         = 1,157 × 2
         ≈ 2,315 req/s
```

### Step 5: Calculate Bandwidth

```text
Average bandwidth = QPS × average request size
                  = 1,157 × 50 KB
                  ≈ 57,850 KB/s
                  ≈ 462 Mbps

Peak bandwidth = 2,315 × 50 KB
               ≈ 113,000 KB/s
               ≈ 904 Mbps
```

Consider both ingress (user → server) and egress (server → user). Egress is usually larger (responses include data, not just requests).

### Step 6: Calculate Number of Servers

Assume each server handles ~1,000 req/s (depends on language, framework, optimization).

```text
Average servers = Average QPS / capacity per server
                = 1,157 / 1,000
                ≈ 2 servers

Peak servers = Peak QPS / capacity per server
             = 2,315 / 1,000
             ≈ 3 servers

Add redundancy: peak × 2 for failover = 6 servers
```

Adjust for:

- Server capacity varies: Go/Rust can handle higher QPS than Python/Ruby.
- CPU-intensive endpoints lower capacity.
- External API calls increase latency and lower throughput.

### Step 7: Calculate Storage

```text
Storage per day = Total requests per day × avg data per request
                = 100,000,000 × 50 KB
                ≈ 5 TB/day

Storage per year = 5 TB × 365
                  ≈ 1.8 PB/year
```

This is the raw write volume. Actual storage depends on data retention:

```text
User data storage = DAU × data per user
                  = 10,000,000 × 100 MB
                  ≈ 1 PB

With 20% growth and 3 years:
  Year 1: 1 PB
  Year 2: 1.2 PB
  Year 3: 1.44 PB
  Total: ~3.64 PB
```

### Step 8: Calculate Cache Size

Cache typically holds hot/active data. 80/20 rule: 20% of data gets 80% of reads.

```text
Hot data = 20% of total data
Cache TTL = 24 hours
Cache size = Hot data + buffer
           = (0.2 × 1 PB) × 1.2 (buffer)
           ≈ 240 TB
```

But this is for extreme scale. For practical purposes:

```text
Cache size = QPS × avg response size × cache TTL
           = 1,157 × 50 KB × 3600 (1 hour)
           ≈ 208 GB
```

A few hundred GB of Redis is practical. If cache needs to be larger, consider tiered caching.

### Step 9: Calculate DB Size

DB size includes:

- Actual data.
- Indexes (typically 1.5-2x data size).
- Replicas.
- Backup/retention.

```text
DB data = 1 PB (user data)
Indexes = 1 PB × 1.5 = 1.5 PB
Total DB = 2.5 PB

With replication (3x):
  Total with replicas = 2.5 PB × 3 = 7.5 PB
```

For more modest systems:

```text
DB data = Storage per year = 1.8 TB
Indexes = 1.8 × 1.5 = 2.7 TB
Total DB = 4.5 TB
Replicas (2 read replicas) = 4.5 × 3 = 13.5 TB
```

---

## More Capacity Parameters

### Memory per Server

```text
OS:              ~2 GB
App runtime:     ~2 GB
Connection pool: ~1 GB
Per-worker:      ~500 MB × number of workers

Example (8 workers):
  Total = 2 + 2 + 1 + (0.5 × 8) = 9 GB per server
```

Recommended: 16 GB RAM per server for moderate loads.

### Connection Pool Size

```text
Max connections = (server instances × workers per server)
                = 6 servers × 8 workers
                = 48 connections

DB max connections should be higher to handle spikes.
```

### Disk I/O

```text
Write I/O = Write QPS × write size
          = (Total QPS × 0.1 write ratio) × 50 KB
          = 115 × 50 KB
          ≈ 5.75 MB/s write

Read I/O = Read QPS × read size
         = (Total QPS × 0.9 read ratio) × 50 KB
         = 1,042 × 50 KB
         ≈ 52 MB/s read
```

### Network Bandwidth (Internal)

Between services (microservices):

```text
Internal traffic = External traffic × microservice hops
                 = 462 Mbps × 3 hops
                 ≈ 1.4 Gbps
```

---

## Practical Formulas Sheet

```text
QPS              = DAU × req_per_user / 86400
Peak QPS         = QPS × peak_factor
Total req/day    = DAU × req_per_user
Bandwidth (bps)  = QPS × avg_req_size_bytes × 8
Servers (avg)    = QPS / capacity_per_server
Servers (peak)   = (Peak QPS / capacity_per_server) × redundancy
Storage (day)    = total_req_day × avg_data_per_req
Storage (year)   = storage_day × 365
Cache size       = hot_data_ratio × total_data × buffer
DB size          = data + (data × index_factor) + replicas
```

---

## Worked Example

### Scenario

Build a URL shortener like TinyURL.

### Assumptions

```text
DAU: 100 million (read users)
Writes per day: 10 million (new URLs)
Reads per day: 1 billion (redirects)
Average URL length: 100 bytes
Average redirect response: ~500 bytes (with metadata)
Peak factor: 3x
Server capacity: 500 req/s
Retention: 5 years
```

### Calculations

```text
Read QPS = 1,000,000,000 / 86,400 ≈ 11,574
Write QPS = 10,000,000 / 86,400 ≈ 116
Peak Read QPS = 11,574 × 3 = 34,722

Bandwidth (read) = 11,574 × 500 bytes × 8 = 46 Mbps
Bandwidth (write) = 116 × 100 bytes × 8 = 0.09 Mbps

Servers (avg) = (11,574 + 116) / 500 ≈ 24
Servers (peak with redundancy) = 34,722 / 500 × 2 ≈ 139

Storage per year = 10,000,000 × 100 bytes × 365 ≈ 365 GB
5 year storage = 365 GB × 5 = 1.8 TB

DB size = 1.8 TB + 2.7 TB (index) = 4.5 TB
With 3x replication = 13.5 TB

Cache = 34,722 × 500 bytes × 3600 (1 hour) ≈ 62.5 GB

Total requests per day = 1,000,000,000 + 10,000,000 = 1.01 billion
```

### Decision

```text
App servers: 24 minimum, 140 for peak (auto-scaling)
DB: 4.5 TB raw, 13.5 TB with replication (PostgreSQL sharded)
Cache: 64 GB Redis cluster
Network: ~50 Mbps (not bottleneck)
```

---

## Summary

| Metric | Formula | Example (10M DAU) |
| --- | --- | --- |
| Total req/day | DAU × req/user | 100M |
| Avg QPS | req/day / 86400 | 1,157 |
| Peak QPS | avg QPS × 2-3 | 2,315 |
| Bandwidth | QPS × req size × 8 | 462 Mbps |
| Servers (avg) | QPS / cap/server | 2 |
| Servers (peak) | peak QPS / cap/server × redundancy | 6 |
| Storage (day) | req/day × data/req | 5 TB |
| Cache | hot data × total × buffer | ~200 GB |
| DB size | data + indexes + replicas | 4.5 TB+ |
