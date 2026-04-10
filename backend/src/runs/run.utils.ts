import type { ReportRunDto } from './run.dto';

interface RunRecord {
  id: string;
  templateId: string;
  status: string;
  resultPath: string | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export function toRunDto(run: RunRecord): ReportRunDto {
  return {
    id: run.id,
    templateId: run.templateId,
    status: run.status,
    resultPath: run.resultPath ?? undefined,
    error: run.error ?? undefined,
    startedAt: run.startedAt?.toISOString(),
    completedAt: run.completedAt?.toISOString(),
    createdAt: run.createdAt.toISOString(),
  };
}
