import { apiClient } from '../http-client';
import type { CreateTemplateDto, ReportTemplateDto, TemplateSourceDto } from '../index';

export function getTemplates(): Promise<ReportTemplateDto[]> {
  return apiClient.get<ReportTemplateDto[]>('reports');
}

export function getDatasources(): Promise<TemplateSourceDto[]> {
  return apiClient.get<TemplateSourceDto[]>('reports/datasources');
}

export function createTemplate(dto: CreateTemplateDto): Promise<ReportTemplateDto> {
  return apiClient.post<ReportTemplateDto, CreateTemplateDto>('reports', dto);
}

export function deleteTemplate(id: string): Promise<void> {
  return apiClient.delete(`reports/${id}`);
}
