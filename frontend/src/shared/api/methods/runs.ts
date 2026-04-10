import { apiClient } from '../http-client';
import type { ReportRunDto } from '../index';

export function getRuns(): Promise<ReportRunDto[]> {
  return apiClient.get<ReportRunDto[]>('runs');
}

export function createRun(
  templateId: string,
  params: Record<string, unknown>,
): Promise<ReportRunDto> {
  return apiClient.post<ReportRunDto, { params: Record<string, unknown> }>(
    `runs/${templateId}/run`,
    { params },
  );
}

export function createFileRun(templateId: string, formData: FormData): Promise<ReportRunDto> {
  return apiClient.postForm<ReportRunDto>(`runs/${templateId}/run/file`, formData);
}
