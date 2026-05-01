# Report Platform Architecture

## 1. Components, data flows, and responsibility boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                        │
│                                                                  │
│   /reports — template management         /runs — run history     │
│   • create template (SQL/API/File)       • list all runs         │
│   • run a report                         • live status (polling) │
│   • delete template                      • download XLSX         │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP (via nginx → /api)
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       NestJS API (port 3000)                     │
│                                                                  │
│   ReportsController         RunsController                       │
│   • GET  /api/reports        • POST /api/reports/:id/run         │
│   • POST /api/reports        • POST /api/reports/:id/run/file    │
│   • DELETE /api/reports/:id  • GET  /api/runs                    │
│   • GET  /api/reports/       • GET  /api/runs/:id/download       │
│         datasources                                               │
│                                                                  │
│   RunsService: merges sourceConfig from template into params,    │
│   enqueues the job in BullMQ                                     │
└───────────────┬───────────────────────────────────────────────────┘
                │ enqueue job
                ▼
┌───────────────────────┐
│    Redis (BullMQ)     │
│    runs queue         │
└───────────┬───────────┘
            │ dequeue
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                       RunWorker (BullMQ)                         │
│                                                                  │
│   1. status → running                                            │
│   2. DynamicProcessor.run(params)                                │
│   3. XlsxRenderer.render(data)                                   │
│   4. StorageService.save(buffer)                                 │
│   5. status → completed / failed                                 │
└──────────────┬───────────────────────────────────────────────────┘
               │ routes by sourceConfig.type
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DynamicProcessor                           │
│                                                                  │
│   type = 'sql', db = 'clickhouse'  →  queryClickhouse()         │
│   type = 'sql', db = 'postgres'    →  queryPostgres()           │
│   type = 'api'                     →  fetch(url)                 │
│   type = 'file'                    →  parseCsv / parseXlsx       │
└──────────────────────────────────────────────────────────────────┘
               │ ReportData { columns[], rows[] }
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  XlsxRenderer → StorageService → uploads/ (Docker named volume) │
│  path stored in ReportRun.resultPath                             │
└──────────────────────────────────────────────────────────────────┘
```

### Responsibility boundaries

| Component           | Responsibility                                                        | Does NOT                       |
| ------------------- | --------------------------------------------------------------------- | ------------------------------ |
| `ReportsController` | Template CRUD, health check                                           | Know about the queue           |
| `RunsController`    | Accept run requests, handle download                                  | Know how reports are generated |
| `RunsService`       | Merge `sourceConfig` from template into params, enqueue job           | Process the job                |
| `RunWorker`         | Job lifecycle: status updates, processor call, file save              | Know about HTTP                |
| `DynamicProcessor`  | Fetch data from source, return `ReportData`                           | Generate files                 |
| `XlsxRenderer`      | `ReportData` → XLSX buffer                                            | Save to disk                   |
| `StorageService`    | Save buffer, return path                                              | Know about file format         |

---

## 2. Adding a new report

### Scenario A — new template without code changes (SQL/API/File)

Done entirely via UI in 2 minutes:

1. Open `http://localhost` → **New Template**
2. Enter name and description
3. Choose source type:
   - **SQL / ClickHouse** — enter a SQL query or leave blank (uses `defaultQuery` from datasource config)
   - **SQL / PostgreSQL** — same
   - **API** — provide URL of an external HTTP GET endpoint
   - **File** — template accepts a CSV or XLSX file on each run
4. Save. `paramsSchema` is generated automatically — the run form appears on its own.

Date filtering (`dateFrom`/`dateTo`) is enabled automatically if `dateField` is set in the datasource config.

### Scenario B — new source type (code change)

If SQL/API/File doesn't fit (e.g. gRPC, S3, Kafka topic):

**Step 1.** Add a variant to `SourceConfig` (`backend/src/runs/run.types.ts`):

```typescript
type SourceConfig =
  | { type: "sql"; db: string; query?: string; dateField?: string }
  | { type: "api"; url: string }
  | { type: "file" }
  | { type: "grpc"; endpoint: string; method: string }; // ← new
```

**Step 2.** Add a branch in `DynamicProcessor.run()`:

```typescript
if (sourceType === "grpc") {
  return this.runGrpc(sourceConfig as Extract<SourceConfig, { type: "grpc" }>);
}
```

**Step 3.** Implement the private method, return `ReportData`:

```typescript
private async runGrpc(config: Extract<SourceConfig, { type: 'grpc' }>): Promise<ReportData> {
  const rows = await this.grpcClient.call(config.endpoint, config.method);
  return { columns: columnsFromRow(rows[0]), rows };
}
```

**Step 4.** Update `ReportsService.buildParamsSchema()` if the new type has specific parameters.

> Queue, worker, rendering, and file download — unchanged.

---

## 3. Design decisions

### 3.1. DynamicProcessor instead of a processor registry

**Problem:** How to support new report types without touching the pipeline?

**Considered:**

- **ProcessorRegistry** — a `{ [type: string]: ReportProcessor }` map, each report type as a class implementing `run(params): Promise<ReportData>`
- **DynamicProcessor with discriminated union** — one class, routing by `sourceConfig.type`

**Chose DynamicProcessor.** With ProcessorRegistry, each new template requires a new class, a module registration, and a registry entry — three change points. DynamicProcessor centralizes all routing logic in one place; extending it means adding one `if` branch and a private method.

**Trade-off:** ProcessorRegistry scales better with dozens of complex custom processors. For a prototype (3 source types) DynamicProcessor is simpler and sufficient.

---

### 3.2. BullMQ instead of pg-boss or raw Redis pub/sub

**Problem:** How to reliably enqueue jobs without losing them on failure?

**Considered:**

- **Raw Redis pub/sub** — minimal dependency, simple
- **pg-boss** — queue on top of PostgreSQL, eliminates Redis
- **BullMQ** — production-ready queue on top of Redis

**Chose BullMQ.** Raw pub/sub is not persistent: if the worker crashes, the job is lost. pg-boss adds polling overhead on PostgreSQL and is slower under high load. BullMQ provides persistence, automatic retries, delayed jobs, and priorities out of the box.

**Trade-off:** Redis becomes an infrastructure dependency. If minimizing infrastructure is a priority, pg-boss is a valid alternative at moderate load.

---

### 3.3. Polling for live status instead of SSE/WebSocket

**Problem:** How to notify the frontend about run status changes in real time?

**Considered:**

- **Polling** — frontend calls `GET /api/runs` every N seconds
- **WebSocket** — bidirectional connection via `socket.io`
- **SSE (Server-Sent Events)** — one-way server-to-client stream over HTTP

**Chose polling.** Reports in the prototype complete in fractions of a second — a 1-second delay is imperceptible. SSE added infrastructure complexity (`RunEventsService`, `Observable`, a dedicated endpoint) for a scenario that already feels instant.

**When to switch:** if reports take minutes, move to SSE. Backend: `RunEventsService` (Node `EventEmitter`) + NestJS `@Sse()` + `Observable`. Frontend: native `EventSource`.

---

### 3.4. ClickHouse for analytical data

**Problem:** Exam event reports aggregate hundreds of millions of rows. Can PostgreSQL handle it?

**Considered:**

- **PostgreSQL** with date-range partitioning
- **TimescaleDB** — PostgreSQL extension for time-series
- **ClickHouse** — columnar OLAP database

**Chose ClickHouse.** PostgreSQL `COUNT + GROUP BY` over 365M rows takes minutes even with indexes, because row-oriented storage reads all columns of every row. ClickHouse reads only the needed columns via columnar storage and vectorized execution — the same query runs in milliseconds. TimescaleDB is a good compromise (stays in the PostgreSQL ecosystem) but falls behind at 100M+ rows.

---

### 3.5. Wait for server response instead of optimistic updates

**Problem:** Update UI immediately or wait for server confirmation?

**Considered:** optimistic updates via `useOptimistic` (React 19, with auto-rollback) or manual `setQueryData` (update cache before response).

**Chose waiting.** Deletion is gated behind a confirmation dialog — a 100ms delay is unnoticeable. Run creation cannot be done optimistically: `ReportRun.id` is only known after the server responds.

**Trade-off:** for deletion, an optimistic update would be appropriate. If needed, `setQueryData` is preferred — the project already uses React Query, and rollback logic stays in one place.

---

### 3.6. Nginx as reverse proxy

**Problem:** CORS is needed in dev (different ports) but not in production.

**Considered:**

- Keep CORS open in production as well
- Nginx reverse proxy

**Chose nginx.** In Docker Compose the frontend is built with `VITE_API_URL=/api` — all requests go to the same host, nginx routes `/api/*` to `backend:3000`. No CORS in production; the browser sees no cross-origin requests. Bonus: nginx serves frontend static files directly without loading NestJS.

---

## 4. What's not implemented and why

| Feature                     | Why not in prototype                          | What production needs                                                                |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Authentication**          | No users in the prototype                     | JWT + refresh tokens; `ReportRun.userId` for data isolation                          |
| **PDF renderer**            | Chromium in Docker image is ~200MB            | `puppeteer` (HTML → PDF) or `pdfkit`; charts via `chart.js` → PNG                   |
| **File storage**            | Docker named volume is enough for prototype   | S3/MinIO; `StorageService` is already abstracted — only it needs to change           |
| **Pagination**              | Small data set, compact tables                | Cursor-based pagination by `createdAt`; infinite scroll on frontend                  |
| **Template editing**        | Create + delete covers the demo scenario      | `PUT /api/reports/:id`; edit form on frontend                                        |
| **Scheduled runs**          | Out of scope for prototype                    | Cron expressions in template; `@nestjs/schedule` or BullMQ delayed jobs              |
| **Tests**                   | Time constraints                              | Unit tests for `DynamicProcessor`; integration tests for worker lifecycle            |
| **Metrics and observability** | No production load                          | Prometheus: queue depth, job execution time, error rate; Grafana dashboard           |

### First priorities when going to production

1. **Authentication** — all platform data is tied to a user
2. **S3 for files** — local filesystem doesn't scale horizontally; `StorageService` is intentionally abstracted for this
3. **Tests for `DynamicProcessor`** — this is the single point where all business logic lives
4. **SSE instead of polling** — when reports start taking minutes
5. **Queue monitoring** — Bull Board is supported by BullMQ out of the box, just needs to be wired up
