# Report Platform

Async report generation platform prototype.

## Stack

- **Backend:** NestJS + TypeScript + Node.js
- **Frontend:** React + TypeScript + Vite (Feature-Sliced Design)
- **Databases:** PostgreSQL (Prisma), ClickHouse
- **Queue:** Redis + BullMQ
- **Infrastructure:** Docker Compose

## Structure

```
report-platform/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── database/          # GlobalModule: PrismaService (Prisma 7 composition pattern)
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts
│   │   │   ├── report.dto.ts          # ReportTemplateDto, CreateTemplateDto, ParamsFieldSchemaDto, TemplateSourceDto
│   │   │   └── index.ts
│   │   ├── datasource/            # DatasourceModule: reads DATASOURCES env, manages CH/pg clients
│   │   │   ├── datasource.service.ts
│   │   │   ├── datasource.module.ts
│   │   │   └── index.ts
│   │   └── runs/
│   │       ├── runs.module.ts
│   │       ├── runs.controller.ts     # POST run/run/file, GET runs, GET runs/:id, GET runs/:id/download
│   │       ├── runs.service.ts        # merges sourceConfig into params before queuing; throws NotFoundException (404) for missing runs
│   │       ├── run.worker.ts          # BullMQ worker, calls DynamicProcessor directly; deletes upload file in finally block
│   │       ├── run.utils.ts           # toRunDto helper
│   │       ├── run.dto.ts             # ReportRunDto, RunReportDto
│   │       ├── run.types.ts           # SourceConfig discriminated union, ReportData
│   │       ├── dynamic.processor.ts   # Single processor: sql/api/file; validates dateField as SQL identifier
│   │       ├── xlsx.renderer.ts       # XLSX generation only, delegates save to StorageService
│   │       ├── storage.service.ts     # File storage abstraction (saves to uploads/)
│   │       └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma       # ReportTemplate (+ sourceConfig), ReportRun, MedicalCertificate models
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── prisma.config.ts        # Prisma 7 datasource config (root level, NOT inside prisma/)
│   ├── package.json
│   ├── tsconfig.json           # excludes: prisma/, prisma.config.ts
│   ├── eslint.config.mjs
│   ├── .prettierrc.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/               # Providers, router (BrowserRouter), Nav, global styles
│   │   ├── pages/
│   │   │   ├── reports-page/  # Report template catalog
│   │   │   │   └── components/  # reports-table/, report-row/, skeleton-rows/
│   │   │   └── runs-page/     # Run history
│   │   │       └── components/  # runs-table/, skeleton-rows/
│   │   ├── widgets/
│   │   │   ├── header/        # App header with navigation
│   │   │   └── footer/        # App footer with API docs link
│   │   ├── entities/
│   │   │   └── report-run/          # RunRow — pure display component (no feature deps)
│   │   │       └── components/run-row/  # Row with status badge, duration, error tooltip
│   │   ├── features/
│   │   │   ├── run-report/          # Dialog with dynamic form based on paramsSchema
│   │   │   │   ├── run-report-dialog.tsx
│   │   │   │   ├── styles.module.scss
│   │   │   │   └── index.ts
│   │   │   ├── create-template/     # Create template dialog (SQL/API/File)
│   │   │   │   ├── create-template-dialog.tsx
│   │   │   │   ├── build-source-config.ts  # buildSourceConfig helper
│   │   │   │   ├── types.ts
│   │   │   │   ├── styles.module.scss
│   │   │   │   └── index.ts
│   │   │   └── delete-template/     # Delete button with confirmation
│   │   │       ├── delete-template-button.tsx
│   │   │       └── index.ts
│   │   └── shared/
│   │       ├── api/
│   │       │   ├── methods/
│   │       │   │   ├── reports.ts   # createTemplate, deleteTemplate
│   │       │   │   └── runs.ts      # createRun, createFileRun
│   │       │   ├── query/
│   │       │   │   ├── reports-queries.ts  # reportQueries (list, datasources)
│   │       │   │   └── runs-queries.ts     # runQueries
│   │       │   ├── index.ts         # auto-generated types from Swagger (do not edit)
│   │       │   ├── schema.d.ts      # auto-generated schema (do not edit)
│   │       │   └── http-client.ts   # ApiClient singleton
│   │       └── ui/                  # Typography, Badge, Skeleton, ClampText, MainLayout
│   ├── scripts/
│   │   └── generate-api.mjs          # Generates schema.d.ts + index.ts from Swagger
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
├── infra/
│   └── clickhouse/
│       └── init.sql            # exam_events table + 150k seed rows (2024-01-01 to 2026-04, random distribution)
├── docker-compose.yml
├── README.md
└── ARCHITECTURE.md
```

## Dependencies

### Backend
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` 11.x
- `@nestjs/bullmq`, `bullmq` — async job queue
- `@prisma/client`, `@prisma/adapter-pg`, `prisma` 7.x — PostgreSQL via Prisma 7
- `@clickhouse/client` — ClickHouse HTTP client
- `pg` — PostgreSQL client (required by Prisma adapter)
- `exceljs` — XLSX generation
- `reflect-metadata`, `rxjs` (NestJS peer dep)
- `eslint`, `prettier`, `lint-staged` (dev) — linting and formatting
- Package manager: **pnpm**

### Frontend
- `react`, `react-dom` 19.x
- `@tanstack/react-query` 5.x — data fetching
- `@mui/material` 9.x — UI kit (Dialog, TextField, Select, Button, etc.)
- `@emotion/react`, `@emotion/styled` — MUI peer dependencies
- `@phosphor-icons/react` — icons
- `react-hook-form` 7.x — form state management (useForm, Controller, register)
- `classnames` 2.x — conditional classname merging (required when element has 2+ classes)
- `sass` — SCSS modules
- `react-router-dom` 7.x — routing
- `openapi-typescript` 7.x (dev) — generates TypeScript types from Swagger
- Package manager: **pnpm**

## Architecture

### Backend
- Global prefix: `/api`
- CORS enabled for `http://localhost:5173` (dev)
- Swagger UI: `/api/docs` (path must include global prefix)
- Pattern: Feature Modules (NestJS)
- `DatabaseModule` — global module, provides `PrismaService` to all modules
- `PrismaService` — composition pattern (not inheritance), Prisma 7 requires `PrismaPg` adapter
- `tsconfig.json` excludes `prisma/` and `prisma.config.ts` (rootDir is `src/`)
- `prisma.config.ts` — at `backend/` root, NOT inside `prisma/` (Prisma 7 looks in CWD)
- `DatasourceService` — single source of truth for datasources; reads `DATASOURCES` env (JSON array, required), creates CH/pg clients by `url`, provides `findAll()`, `findById()`, `queryClickhouse()`, `queryPostgres()`; closes clients in `onModuleDestroy`
- `DynamicProcessor` — single processor, reads `params._sourceConfig` and routes by type (sql/api/file); for sql resolves engine via `DatasourceService.findById(config.db)`
  - PostgreSQL SQL branch uses parameterized queries (`$1`, `$2`) to prevent SQL injection
  - Date filter injected only when `sourceConfig.dateField` is set; field name validated as SQL identifier (`/^[a-zA-Z_][a-zA-Z0-9_]*$/`) before use; ClickHouse named params `{field:Date}`, PostgreSQL positional `$1`/`$2`
  - `runApi` uses `AbortController` with 30s timeout to prevent worker hang on slow external APIs
  - CSV parser is RFC 4180-compliant (handles quoted values with commas)
- Worker calls `DynamicProcessor` directly (no registry)
- `RunsService.createRun` — merges `sourceConfig` from template into params before queuing (`_sourceConfig`)
- `run.utils.ts` — shared `toRunDto` helper, used in service and worker
- `/api/health` — returns `{ status, postgres }`, pings DB via `PrismaService.pool`

### Frontend
- Architecture: Feature-Sliced Design (FSD)
- Routing: `BrowserRouter` + `Routes`, pages `/` and `/runs`
- Styling: CSS Modules + SCSS (`styles.module.scss`), CSS variables in `:root`
- UI Kit: MUI — Dialog, TextField, Select, Button; custom components in `shared/ui`
- HTTP: `ApiClient` in `shared/api/http-client.ts`, base URL from `VITE_API_URL` env var
  - GET uses template strings (`${baseUrl}${endpoint}`), not `new URL()` — `new URL(relative, relativeBase)` throws TypeError in browser
- Each component is a separate folder with `index.ts` and `styles.module.scss`
- API layer centralized in `shared/api/`:
  - `methods/` — mutation functions (createTemplate, deleteTemplate, createRun, createFileRun)
  - `query/` — query factories with `queryOptions`; `datasources` is nested inside `reportQueries`
  - `index.ts` — auto-generated types only, do not add exports manually
- `widgets/` layer — only `header/` and `footer/`; self-contained layout blocks with no page-specific logic
- `pages/` layer — each page owns its data-fetching components (`reports-table/`, `report-row/`, `runs-table/`, `skeleton-rows/`); components that import from `features/` live here (not in `entities/`)
- `entities/` layer — pure display components with no feature-layer dependencies:
  - `entities/report-run/` — `RunRow` component, belongs here because it only imports from `shared/`
  - API code (queries, mutations) stays in `shared/api/` — entities layer is UI-only
- Data fetching: Query Factories with `queryOptions` from `@tanstack/react-query`
- Forms: `react-hook-form` — `useForm` + `register` for plain fields, `Controller` for MUI Select/RadioGroup
  - `watch()` for reactive values and manual `isValid` validation
  - `handleSubmit` wraps `mutate` call
  - File input managed via `useRef<HTMLInputElement>` separately from RHF
- Live status: polling via `refetchInterval: 1000` в `RunsTable` — активен пока есть runs со статусом `pending`/`running`, останавливается автоматически
- `Badge` — `warning` variant has CSS pulse animation; use `classnames` for 2+ classes on element
- Mobile-first layout: base styles for mobile (16px padding), `@media (min-width: 768px)` for desktop (32px); tables have `overflow-x: auto` for horizontal scroll on narrow screens
- Download URL: uses `VITE_API_URL` (not a relative path — in dev goes directly to backend)
- Types: generated from Swagger (`pnpm generate:api`) → `shared/api/schema.d.ts` + `shared/api/index.ts`
  - Swagger URL: `http://localhost:3000/api/docs-json` (with global prefix `/api`, not `/docs-json`)
  - All backend types taken from `@/shared/api/index.ts`, never written manually

### Docker
- Frontend nginx proxies `/api/` → `http://backend:3000/api/` (no CORS in prod)
- `VITE_API_URL=/api` build arg — requests go to same host, nginx handles routing
- `uploads_data` — named Docker volume, mounted at `/app/uploads` in backend container
- Backend Dockerfile: `ENV PATH="/app/node_modules/.bin:${PATH}"` — required so `prisma` and `tsx` are available in CMD
- Backend CMD: `prisma migrate deploy && prisma db seed && node dist/main` — migrations and seed run on container start
- Healthchecks: postgres (`pg_isready`), redis (`redis-cli ping`), clickhouse (`clickhouse-client --query 'SELECT 1'` + start_period 30s)
- Backend depends on all three services via `condition: service_healthy`
- Backend has `healthcheck` on `GET /api/health` (wget, interval 5s, retries 15, start_period 40s)
- Frontend depends on backend via `condition: service_healthy` — waits for migrations + seed to complete

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/reports | List report templates |
| POST | /api/reports | Create template |
| DELETE | /api/reports/:id | Delete template (cascades runs) |
| GET | /api/reports/datasources | `[{id:'clickhouse',...},{id:'postgres',...}]` |
| POST | /api/reports/:id/run | Trigger async report (JSON params) |
| POST | /api/reports/:id/run/file | Trigger async report (multipart, CSV/XLSX) |
| GET | /api/runs | List report runs |
| GET | /api/runs/:id | Get single run (status check) |
| GET | /api/runs/:id/download | Download generated XLSX file |

## Data Model

```typescript
// PostgreSQL
ReportTemplate { id, type: String @unique, name, description?, paramsSchema: Json, sourceConfig: Json, createdAt }
ReportRun      { id, templateId, params: Json, status, resultPath?, error?, startedAt?, completedAt? }
MedicalCertificate { id, issuedAt, enterprise, doctorName, specialization, workerName, validUntil, status }
// MedicalCertificate seed: ~5k rows, specializations: therapist/cardiologist/ophthalmologist/neurologist

// ClickHouse
exam_events    { id, exam_date, enterprise, status: passed|failed|skipped, duration_sec }
// seed: 10k rows, 2024-01-01 — 2026-04
```

## Key Types

```typescript
type ReportStatus = 'pending' | 'running' | 'completed' | 'failed';

// sourceConfig — stored in ReportTemplate.sourceConfig
type SourceConfig =
  | { type: 'sql'; db: string; query?: string; dateField?: string }  // db — datasource id from DATASOURCES env; dateField — column name for date range filter injection
  | { type: 'api'; url: string }
  | { type: 'file' };

// DatasourceConfig — single datasource config from DATASOURCES env var
interface DatasourceConfig {
  id: string;
  label: string;
  engine: 'clickhouse' | 'postgres';
  url: string;
  description?: string;
  defaultQuery?: string;
  dateField?: string;  // column name for date range filter injection; if set, paramsSchema gets dateFrom/dateTo
}

interface ReportData {
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
}

// paramsSchema — auto-generated in ReportsService.buildParamsSchema
// sql: { dateFrom: date/required, dateTo: date/optional }
// api: {} (empty — runs without params)
// file: { file: file/required }
interface ParamsFieldSchema {
  type: 'date' | 'select' | 'number' | 'file';
  label: string;
  required: boolean;
  default?: number;
}
```

## Code Style

- No comments in code — write self-documenting code
- TypeScript strict mode, no `any`
- kebab-case for files and folders
- Fixed dependency versions only (no `^`)
- Pre-commit hooks via Husky: lint-staged runs ESLint + Prettier on both `frontend/` and `backend/`
- Docker: always run `docker-compose up --build` to avoid stale cached images
