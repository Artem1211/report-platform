import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PrismaService } from '../database';
import type { ReportRunDto } from './run.dto';
import { toRunDto } from './run.utils';
import { RUNS_QUEUE } from './run.worker';

@Injectable()
export class RunsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(RUNS_QUEUE) private readonly queue: Queue,
  ) {}

  async createRun(templateId: string, params: Record<string, unknown>): Promise<ReportRunDto> {
    const template = (await this.prisma.db.reportTemplate.findUniqueOrThrow({
      where: { id: templateId },
    })) as unknown as { sourceConfig: unknown };
    const mergedParams = { ...params, _sourceConfig: template.sourceConfig };

    const run = await this.prisma.db.reportRun.create({
      data: { templateId, params: mergedParams as object, status: 'pending' },
    });
    await this.queue.add('process', { runId: run.id });
    return toRunDto(run);
  }

  async findAll(): Promise<ReportRunDto[]> {
    const rows = await this.prisma.db.reportRun.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toRunDto);
  }

  async findOne(id: string): Promise<ReportRunDto> {
    const run = await this.prisma.db.reportRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException(`Run ${id} not found`);
    return toRunDto(run);
  }

  async getResultPath(id: string): Promise<string | null> {
    const run = await this.prisma.db.reportRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException(`Run ${id} not found`);
    return run.resultPath;
  }
}
