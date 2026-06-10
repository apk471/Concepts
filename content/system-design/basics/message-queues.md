# Message Queues

---

## Brief

A message queue is a durable buffer between producers (services that send messages) and consumers (services that process messages). The queue decouples the two, allowing each to operate at its own pace.

Message queues solve:

- **Spike handling**: Queue absorbs traffic spikes, consumers drain at their own pace.
- **Decoupling**: Producers don't need to know about consumers.
- **Reliability**: Messages survive crashes if persisted.
- **Async processing**: Producers return immediately, work happens later.

---

## Core Concepts

### Producer

The service that publishes messages to the queue.

### Consumer

The service that pulls messages from the queue and processes them.

### Queue

A buffer that holds messages until a consumer picks them up. Messages are typically removed after consumption (at-least-once or exactly-once semantics).

### Message

A unit of data sent from producer to consumer. Usually contains a payload (JSON, Avro, Protobuf) and metadata (ID, timestamp, headers).

### Broker

The server that manages the queue, stores messages, and delivers them to consumers.

### Acknowledgement (ACK)

The consumer tells the broker "I processed this message successfully." The broker can then remove the message.

If the consumer fails to ACK (crash, timeout), the broker redelivers the message.

### Dead-Letter Queue (DLQ)

A separate queue for messages that failed processing after multiple retries. These need manual inspection.

---

## Kafka

### What Is Kafka?

Apache Kafka is a distributed event streaming platform. It is not a traditional message queue, but is often used as one.

### Key Concepts

| Concept | Description |
| --- | --- |
| Topic | A named stream of records (like a category). |
| Partition | A topic is split into partitions for parallelism. Each partition is ordered. |
| Offset | A unique ID for each record within a partition. |
| Producer | Writes records to a topic (optionally to a specific partition). |
| Consumer | Reads records from a topic. |
| Consumer Group | A group of consumers that divide partitions among themselves. |
| Broker | A Kafka server that stores partitions. |
| Replication | Partitions are replicated across brokers for fault tolerance. |
| Retention | Records are kept for a configurable time (not removed after consumption). |

### How Kafka Works

```text
Producer -> Topic (Partition 0, Partition 1, Partition 2)
            -> Consumer Group A (Consumer A1, Consumer A2)
            -> Consumer Group B (Consumer B1)
```

- Each partition is an ordered, immutable log.
- Consumers within a group split partitions (each partition goes to one consumer).
- Multiple consumer groups can read the same topic independently.
- Consumers track their offset (position in the partition) themselves.

### Kafka Message Flow

1. Producer writes record to topic partition.
2. Kafka appends to the partition log on disk.
3. Consumer polls for new records.
4. Consumer processes record and commits offset.
5. If consumer crashes, it restarts from the last committed offset.

### Key Features

- **High throughput**: Millions of messages/second.
- **Durability**: Messages persisted to disk, replicated across brokers.
- **Ordering**: Messages within a partition are ordered.
- **Replay**: Consumers can rewind and reprocess old messages.
- **Exactly-once semantics**: Available with proper config.
- **Scale**: Add partitions and consumers for more parallelism.

### When to Use Kafka

- High-throughput event streaming (clickstreams, metrics, logs).
- Event sourcing (store events as the source of truth).
- Data pipeline between systems (ETL, streaming ETL).
- Multiple independent consumer groups need the same data.
- Message replay is needed.
- You need strong durability guarantees.

### When NOT to Use Kafka

- Simple task queue with low throughput.
- You need per-message routing flexibility (use RabbitMQ).
- You need complex routing rules.
- Latency-sensitive workloads where every ms matters (Kafka has higher latency than RabbitMQ).
- Small team with limited ops experience (Kafka is complex to operate).

---

## RabbitMQ

### What Is RabbitMQ?

RabbitMQ is a message broker that implements AMQP (Advanced Message Queuing Protocol). It is a traditional message queue with flexible routing.

### Key Concepts

| Concept | Description |
| --- | --- |
| Producer | Sends messages to an exchange. |
| Exchange | Receives messages and routes them to queues based on rules. |
| Queue | Buffers messages for consumers. |
| Consumer | Pulls or receives pushed messages from a queue. |
| Binding | A rule that connects an exchange to a queue. |
| Virtual Host | Isolated environment for different applications. |

### Exchange Types

| Type | Routing |
| --- | --- |
| Direct | Routes to queue with matching routing key. |
| Topic | Routes based on pattern matching (wildcards: `*`, `#`). |
| Fanout | Routes to all bound queues (broadcast). |
| Headers | Routes based on header attributes. |

### How RabbitMQ Works

```text
Producer -> Exchange
            -> (bindings) -> Queue 1 -> Consumer A
                          -> Queue 2 -> Consumer B
```

1. Producer sends a message to an exchange with a routing key.
2. Exchange checks bindings and routes to matching queues.
3. Queues buffer messages.
4. Consumers receive messages (push or pull).
5. Consumer ACKs after processing.

### Key Features

- **Flexible routing**: Multiple exchange types for different patterns.
- **Low latency**: Suitable for real-time messaging.
- **Mature and stable**: Widely used, well-documented.
- **Management UI**: Built-in web UI for monitoring.
- **Plugin system**: Extensible (e.g., delayed messages, sharding).

### When to Use RabbitMQ

- Simple task queues.
- Need complex routing logic.
- Low-latency messaging.
- Small to medium throughput (< 100k messages/second).
- You want a mature, easy-to-operate broker.
- Delayed message delivery or scheduled tasks.

### When NOT to Use RabbitMQ

- Very high throughput (millions of msg/s).
- Message replay is needed.
- Multiple independent consumer groups.
- Long-term message retention.

---

## Kafka vs RabbitMQ

| Aspect | Kafka | RabbitMQ |
| --- | --- | --- |
| Model | Distributed log | Message broker (AMQP) |
| Storage | Persisted, retained | Removed after ACK (typically) |
| Throughput | Millions/sec | 10k-100k/sec |
| Latency | Low (but higher than RMQ) | Very low |
| Ordering | Per partition | Per queue (within single consumer) |
| Routing | By topic/partition | Flexible (direct, topic, fanout, headers) |
| Consumer model | Pull (polling) | Push or pull |
| Replay | Yes (seek to offset) | No (messages removed) |
| Durability | Very high (replication) | High (mirrored queues) |
| Operations | Complex | Moderate |
| Best for | Event streaming, logging, metrics, pipelines | Task queues, RPC, routing scenarios |

---

## Choosing Between Kafka and RabbitMQ

### Use Kafka When

```text
- You need to handle > 100k messages/second.
- Consumers need to replay messages.
- Multiple consumer groups read the same stream.
- Messages are logs/events/metrics.
- Long retention is important.
```

### Use RabbitMQ When

```text
- You need complex routing (topic, headers, direct).
- Low latency is critical.
- Throughput < 100k messages/second.
- You want simple operations.
- You need delayed messages or scheduled delivery.
```

---

## Common Patterns

### Work Queue (Competing Consumers)

Multiple consumers read from the same queue. Each message goes to one consumer. This distributes work.

```text
Producer -> [Queue] -> Consumer 1
                     -> Consumer 2
                     -> Consumer 3
```

### Pub/Sub (Fan-out)

One message goes to all subscribers. Each consumer group (in Kafka) or each bound queue (in RabbitMQ) gets every message.

```text
Producer -> [Topic/Exchange] -> Queue A -> Group A
                              -> Queue B -> Group B
                              -> Queue C -> Group C
```

### Routing

Messages are routed to specific queues based on routing keys or patterns.

```text
Producer -> Exchange (topic)
            -> "order.created" -> Order Service Queue
            -> "payment.*"     -> Payment Service Queue
            -> "*.failed"      -> Alert Queue
```

---

## Summary

| | Kafka | RabbitMQ |
| --- | --- | --- |
| Type | Distributed event log | Message broker |
| Routing | Topic-based | Flexible (exchanges) |
| Throughput | Millions/sec | < 100k/sec |
| Message retention | Configurable (time/size) | Until consumed |
| Replay | Yes | No |
| Operations | Complex | Moderate |
| Latency | ~10ms | ~1ms |
| Use case | Event streaming, pipelines | Task queues, routing |
