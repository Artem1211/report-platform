# Report Platform

![CI](https://github.com/artemnechipurenko/report-platform/actions/workflows/ci.yml/badge.svg)

Async report generation platform. Create templates via UI, run them on demand, download results as XLSX.

## Quick Start

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript |
| Frontend | React 19 + Vite + FSD |
| Queue | Redis + BullMQ |
| Primary DB | PostgreSQL + Prisma 7 |
| Analytics DB | ClickHouse |
| Infrastructure | Docker Compose + nginx |

## Features

- **Dynamic templates** — create SQL / API / File templates via UI
- **Async execution** — jobs are queued with BullMQ and processed in the background
- **Live status** — polling via `refetchInterval`, stops automatically when done
- **XLSX download** — generated reports are available immediately after completion

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md)

## Local Development

```bash
# Infrastructure (postgres, redis, clickhouse)
docker-compose up postgres redis clickhouse

# Backend — requires DATASOURCES env variable
cd backend
pnpm install
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/report_platform \
REDIS_URL=redis://127.0.0.1:6379 \
DATASOURCES='[{"id":"clickhouse","label":"ClickHouse","engine":"clickhouse","url":"http://localhost:8123","defaultQuery":"SELECT * FROM exam_events LIMIT 1000","dateField":"exam_date"},{"id":"postgres","label":"PostgreSQL","engine":"postgres","url":"postgresql://postgres:postgres@localhost:5432/report_platform","defaultQuery":"SELECT * FROM \"MedicalCertificate\" LIMIT 1000","dateField":"issuedAt"}]' \
pnpm start:dev

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000/api  
Swagger: http://localhost:3000/api/docs

> After changing backend DTOs, regenerate frontend types:
> ```bash
> cd frontend && pnpm generate:api
> ```
