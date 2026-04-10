import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { ReportRunDto, RunReportDto } from './run.dto';
import { RunsService } from './runs.service';
import { StorageService } from './storage.service';

@ApiTags('runs')
@Controller()
export class RunsController {
  constructor(
    private readonly runsService: RunsService,
    private readonly storageService: StorageService,
  ) {}

  @Post('runs/:templateId/run')
  @ApiResponse({ status: 201, type: ReportRunDto })
  createRun(@Param('templateId') id: string, @Body() dto: RunReportDto): Promise<ReportRunDto> {
    return this.runsService.createRun(id, dto.params);
  }

  @Post('runs/:templateId/run/file')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: ReportRunDto })
  @UseInterceptors(FileInterceptor('file'))
  async createFileRun(
    @Param('templateId') id: string,
    @Body('params') rawParams: string,
    @UploadedFile() file: { originalname: string; buffer: Buffer },
  ): Promise<ReportRunDto> {
    if (!file) throw new BadRequestException('File is required');

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      throw new BadRequestException('Only CSV and XLSX files are supported');
    }

    const filename = `upload_${Date.now()}.${ext}`;
    const filePath = await this.storageService.save(filename, file.buffer);

    const params = rawParams ? (JSON.parse(rawParams) as Record<string, unknown>) : {};
    return this.runsService.createRun(id, { ...params, filePath });
  }

  @Get('runs')
  @ApiResponse({ status: 200, type: [ReportRunDto] })
  findAll(): Promise<ReportRunDto[]> {
    return this.runsService.findAll();
  }

  @Get('runs/:id')
  @ApiResponse({ status: 200, type: ReportRunDto })
  findOne(@Param('id') id: string): Promise<ReportRunDto> {
    return this.runsService.findOne(id);
  }

  @Get('runs/:id/download')
  async download(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const path = await this.runsService.getResultPath(id);
    if (!path) {
      throw new NotFoundException('Report file not ready');
    }
    res.download(path, `report-${id}.xlsx`);
  }
}
