import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database';
import { DatasourceService } from '../datasource';
import type { SourceConfig } from '../runs/run.types';
import type { CreateTemplateDto, ReportTemplateDto, TemplateSourceDto } from './report.dto';

function toTemplateDto(r: {
  id: string;
  type: string;
  name: string;
  description: string | null;
  paramsSchema: unknown;
  sourceConfig: unknown;
  createdAt: Date;
}): ReportTemplateDto {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    description: r.description ?? undefined,
    paramsSchema: r.paramsSchema,
    sourceConfig: r.sourceConfig as SourceConfig,
    createdAt: r.createdAt.toISOString(),
  };
}

// Extension point: add params schema for new source types here
function buildParamsSchema(sourceConfig: SourceConfig): Record<string, unknown> {
  if (sourceConfig.type === 'file') {
    return {
      file: { type: 'file', label: 'Файл', required: true },
    };
  }

  if (sourceConfig.type === 'api') {
    return {};
  }

  if (!sourceConfig.dateField) {
    return {};
  }

  return {
    dateFrom: { type: 'date', label: 'Дата от', required: true },
    dateTo: { type: 'date', label: 'Дата до', required: false },
  };
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly datasources: DatasourceService,
  ) {}

  async findAllTemplates(): Promise<ReportTemplateDto[]> {
    const rows = await this.prisma.db.reportTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toTemplateDto);
  }

  async createTemplate(dto: CreateTemplateDto): Promise<ReportTemplateDto> {
    const slug = dto.name.toLowerCase().replace(/\W+/g, '_').slice(0, 30);
    const type = `${slug}_${Date.now()}`;
    const paramsSchema = buildParamsSchema(dto.sourceConfig);

    const row = await this.prisma.db.reportTemplate.create({
      data: {
        type,
        name: dto.name,
        description: dto.description ?? '',
        paramsSchema: paramsSchema as object,
        sourceConfig: dto.sourceConfig as object,
      },
    });

    return toTemplateDto(row);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.prisma.db.$transaction([
      this.prisma.db.reportRun.deleteMany({ where: { templateId: id } }),
      this.prisma.db.reportTemplate.delete({ where: { id } }),
    ]);
  }

  getDataSources(): TemplateSourceDto[] {
    return this.datasources.findAll();
  }
}
