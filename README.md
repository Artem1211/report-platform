# Report Platform

Платформа асинхронной генерации отчётов. Создавай шаблоны через UI, запускай по требованию, скачивай результаты в XLSX.

## Быстрый старт

```bash
docker-compose up --build
```

| Сервис | URL |
|--------|-----|
| Фронтенд | http://localhost |
| Backend API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |

## Стек

| Слой | Технология |
|------|-----------|
| Backend | NestJS + TypeScript |
| Frontend | React 19 + Vite + FSD |
| Очередь | Redis + BullMQ |
| Основная БД | PostgreSQL + Prisma 7 |
| Аналитическая БД | ClickHouse |
| Инфраструктура | Docker Compose + nginx |

## Возможности

- **Динамические шаблоны** — создание SQL / API / File шаблонов через UI
- **Асинхронное выполнение** — задачи ставятся в очередь BullMQ, обрабатываются в фоне
- **Статус в реальном времени** — поллинг через `refetchInterval`, останавливается автоматически
- **Скачивание XLSX** — готовые отчёты доступны сразу после завершения

## Архитектура

См. [ARCHITECTURE.md](./ARCHITECTURE.md)

## Локальная разработка

```bash
# Инфраструктура (postgres, redis, clickhouse)
docker-compose up postgres redis clickhouse

# Backend — требует переменную DATASOURCES
cd backend
pnpm install
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/report_platform \
REDIS_URL=redis://127.0.0.1:6379 \
DATASOURCES='[{"id":"clickhouse","label":"ClickHouse","engine":"clickhouse","url":"http://localhost:8123","defaultQuery":"SELECT * FROM exam_events LIMIT 1000","dateField":"exam_date"},{"id":"postgres","label":"PostgreSQL","engine":"postgres","url":"postgresql://postgres:postgres@localhost:5432/report_platform","defaultQuery":"SELECT * FROM \"MedicalCertificate\" LIMIT 1000","dateField":"issuedAt"}]' \
pnpm start:dev

# Frontend (отдельный терминал)
cd frontend
pnpm install
pnpm dev
```

Фронтенд: http://localhost:5173  
Backend: http://localhost:3000/api  
Swagger: http://localhost:3000/api/docs

> После изменения DTO на бэке — перегенерировать типы фронта:
> ```bash
> cd frontend && pnpm generate:api
> ```
