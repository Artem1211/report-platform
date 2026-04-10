DROP TABLE IF EXISTS "Report";

CREATE TABLE "Enterprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Enterprise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paramsSchema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReportTemplate_type_key" ON "ReportTemplate"("type");

CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "resultPath" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
