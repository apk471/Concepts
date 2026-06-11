# Workers in Message Queues

---

## Brief

Workers are consumer processes that pull messages from a queue and process them. They are the "execution" part of the message queue pattern. Workers enable asynchronous, distributed task processing.

---

## Worker Pattern

```mermaid
flowchart LR
  P[Producer] --> Q[Queue]
  Q --> W1[Worker 1]
  Q --> W2[Worker 2]
  Q --> W3[Worker 3]
```

1. Producer sends a task (message) to a queue.
2. A worker picks up the message.
3. Worker processes the task.
4. Worker acknowledges completion (ACK).
5. If worker fails, message is redelivered to another worker.

---

## How Workers Work

### Pull Model (Kafka)

Workers actively poll the broker for new messages.

```mermaid
sequenceDiagram
  participant W as Worker
  participant B as Broker
  W->>B: Got any new messages?
  B-->>W: Batch of 100 messages from partition 0
  Note over W: Processing... (commits offsets)
  W->>B: Got any new messages?
```

Advantages:
- Workers control their own pace.
- Backpressure is built-in (if workers are slow, they just poll less).
- Good for batch processing.

Disadvantages:
- Higher latency (polling interval).
- Need to manage polling loops and offset commits.

### Push Model (RabbitMQ)

Broker pushes messages to workers.

```mermaid
sequenceDiagram
  participant B as Broker
  participant W as Worker
  B->>W: Here's a message. Process it.
  W-->>B: Done. ACK.
  B->>W: Here's another message.
```

Advantages:
- Lower latency (messages pushed immediately).
- Simple consumer code.

Disadvantages:
- Workers can be overwhelmed (backpressure).
- Need prefetch limits to avoid flooding.

---

## Worker Responsibilities

### 1. Message Consumption

Receive messages from the queue. Handle both pull (polling) and push models.

### 2. Processing

Execute the task: transform data, call APIs, write to DB, generate files, etc.

### 3. Acknowledgement

Tell the broker the message was processed successfully.

- **Auto-ACK**: Broker removes message as soon as it's sent (risk: message lost if worker crashes).
- **Manual ACK**: Worker explicitly ACKs after processing (safe but slower).

### 4. Error Handling

What happens when processing fails:

- **Retry**: Re-queue the message for another attempt.
- **DLQ**: Send to dead-letter queue after max retries.
- **Log**: Record the failure for debugging.

### 5. Idempotency

Workers should handle duplicate messages safely. Since most queues guarantee at-least-once delivery, the same message might be processed twice.

```mermaid
flowchart TD
  Start["Worker processes order.created"] --> Check{"Already processed?<br/>(by ID)"}
  Check -->|Yes| Skip[Skip — idempotent]
  Check -->|No| Proc[Process and mark as done]
```

---

## Worker Concurrency

### Single-threaded Worker

Processes one message at a time. Simple but slow.

### Multi-threaded Worker

Multiple threads process messages concurrently from the same queue.

```mermaid
flowchart TD
  W[Worker process]
  W --> T1[Thread 1: processing message A]
  W --> T2[Thread 2: processing message B]
  W --> T3[Thread 3: processing message C]
```

Pros: Higher throughput per worker.
Cons: Race conditions, shared state, ordering lost.

### Multi-process Worker

Multiple OS processes (or containers) work on the queue.

```mermaid
flowchart TD
  Q[Queue]
  Q --> C1[Container 1: Worker A]
  Q --> C2[Container 2: Worker B]
  Q --> C3[Container 3: Worker C]
```

Pros: No shared state, easy scaling.
Cons: More resource overhead.

### Prefetch / Batching Control

- **RabbitMQ prefetch**: How many messages to send a worker before waiting for ACKs. Lower = fairer distribution, higher = better throughput.
- **Kafka batch size**: How many records to return in one poll. Workers can process in batches for efficiency.

---

## Worker Scaling

### Horizontal Scaling

Add more worker instances to handle more load.

```mermaid
flowchart LR
  A[Queue backlog growing] --> B[Add 5 more workers] --> C[Backlog drains]
```

- Autoscaling based on queue depth.
- Works well when workers are stateless.

### Vertical Scaling

Give each worker more CPU/RAM.

- Useful for CPU-intensive tasks (video encoding, image processing).
- Limited by machine size.

### Partition Scaling (Kafka)

Add more partitions to increase parallelism.

```mermaid
flowchart LR
  A[Topic with 3 partitions] --> B[Max 3 consumers in a group]
  C[Increase to 6 partitions] --> D[Max 6 consumers]
```

---

## Common Worker Scenarios

### Image Processing

```mermaid
flowchart TD
  U[User uploads image] --> API[API Server] --> Q[Queue] --> W[Worker]
  W --> S1[1. Download original image]
  S1 --> S2["2. Generate thumbnails (100x100, 500x500, 1000x1000)"]
  S2 --> S3[3. Upload thumbnails to CDN]
  S3 --> S4[4. Update DB with CDN URLs]
  S4 --> S5[5. ACK message]
```

### Email Sending

```mermaid
flowchart TD
  O[Order placed] --> OS[Order Service] --> Q[Queue] --> W[Email Worker]
  W --> S1[1. Read order details]
  S1 --> S2[2. Render email template HTML]
  S2 --> S3[3. Send via SMTP/API]
  S3 --> S4[4. Update delivery status in DB]
  S4 --> S5[5. ACK or DLQ on failure]
```

### Video Transcoding

```mermaid
flowchart TD
  V[Video uploaded] --> API[API] --> Q[Queue] --> W[Transcoding Worker]
  W --> S1[1. Download source video]
  S1 --> S2[2. Transcode to multiple formats/resolutions]
  S2 --> S3[3. Generate thumbnails and previews]
  S3 --> S4[4. Upload to CDN]
  S4 --> S5[5. Notify completion via callback or status topic]
```

### Scheduled Tasks

```mermaid
flowchart TD
  Cron[Cron trigger] --> Q[Queue] --> W[Worker]
  W --> S1[1. Read batch of records needing processing]
  S1 --> S2[2. Process each record]
  S2 --> S3[3. Mark as done]
  S3 --> S4{Time remains?}
  S4 -->|Yes| S1
  S4 -->|No| Done[Stop]
```

---

## Worker Failure Modes

### Crash During Processing

```mermaid
flowchart TD
  A[Worker picks up message] --> B[Starts processing] --> C[Crashes]
  C --> D[Message was not ACKed]
  D --> E["Broker redelivers to another worker<br/>(or same worker after restart)"]
```

### Poison Pill Message

A message that always fails to process (bad format, missing data).

```mermaid
flowchart LR
  W1[Worker 1] --> T[tries, fails, retries, fails again] --> DLQ[(DLQ)]
  W2[Worker 2] -. would get the same result .-> T
```

Solution: Track retry count, move to DLQ after limit.

### Slow Worker

A worker that takes too long to process.

```text
- Messages pile up in the queue.
- Other workers finish their messages but can't help.
- Solution: Scale workers, split the task, or time-box processing.
```

### Worker Thundering Herd

All workers restart simultaneously and all try to claim messages.

```text
- Many workers contend for messages.
- Can overwhelm DB or external services.
- Solution: Gradual startup, rate limiting.
```

---

## Monitoring Workers

### Key Metrics

| Metric | What it tells you |
| --- | --- |
| Queue depth | How many messages are waiting |
| Processing time | How long each message takes |
| Success/failure rate | Error rate, health of system |
| Worker count | How many workers are active |
| Message age | How long messages have been waiting |
| Retry count | How many times messages are retried |

### Alerts

- Queue depth growing (workers can't keep up).
- High failure rate (bad messages or system issue).
- No active workers (deployment or config issue).
- Messages in DLQ (need manual inspection).

---

## Summary

| Concept | Description |
| --- | --- |
| Worker | Consumer that pulls and processes queue messages |
| ACK | Confirmation that message was processed successfully |
| Concurrency | Multi-thread, multi-process, or multi-instance |
| Scaling | Add workers (horizontal) or increase resources (vertical) |
| Error handling | Retry, DLQ, idempotent processing |
| Backpressure | Workers control pace in pull model; prefetch limits in push model |
| Monitoring | Queue depth, processing time, error rate, worker count |
