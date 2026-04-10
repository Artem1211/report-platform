import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../database';
import {
  CreateTemplateDto,
  ParamsFieldSchemaDto,
  ReportTemplateDto,
  TemplateSourceDto,
} from './report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiExtraModels(ParamsFieldSchemaDto)
@Controller()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  async health(): Promise<{ status: string; postgres: string }> {
    try {
      await this.prisma.pool.query('SELECT 1');
      return { status: 'ok', postgres: 'ok' };
    } catch {
      return { status: 'degraded', postgres: 'error' };
    }
  }

  @Get('reports')
  @ApiResponse({ status: 200, type: [ReportTemplateDto] })
  findAllTemplates(): Promise<ReportTemplateDto[]> {
    return this.reportsService.findAllTemplates();
  }

  @Post('reports')
  @ApiResponse({ status: 201, type: ReportTemplateDto })
  createTemplate(@Body() dto: CreateTemplateDto): Promise<ReportTemplateDto> {
    return this.reportsService.createTemplate(dto);
  }

  @Delete('reports/:id')
  @ApiResponse({ status: 200 })
  deleteTemplate(@Param('id') id: string): Promise<void> {
    return this.reportsService.deleteTemplate(id);
  }

  @Get('reports/datasources')
  @ApiResponse({ status: 200, type: [TemplateSourceDto] })
  getDataSources(): TemplateSourceDto[] {
    return this.reportsService.getDataSources();
  }
}
