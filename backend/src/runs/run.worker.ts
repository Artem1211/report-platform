import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { unlink } from 'fs/promises';

import { PrismaService } from '../database';
import { DynamicProcessor } from './dynamic.processor';
import { XlsxRenderer } from './xlsx.renderer';

export const RUNS_QUEUE = 'runs';

interface RunJob {
  runId: string;
}

@Processor(RUNS_QUEUE)
export class RunWorker extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicProcessor: DynamicProcessor,
    private readonly renderer: XlsxRenderer,
  ) {
    super();
  }

  async process(job: Job<RunJob>): Promise<void> {
    const { runId } = job.data;

    const running = await this.prisma.db.reportRun.update({
      where: { id: runId },
      data: { status: 'running', startedAt: new Date() },
    });

    const params = running.params as Record<string, unknown>;
    const uploadPath = typeof params['filePath'] === 'string' ? params['filePath'] : null;

    try {
      const data = await this.dynamicProcessor.run(params);
      const resultPath = await this.renderer.render(runId, data);

      await this.prisma.db.reportRun.update({
        where: { id: runId },
        data: { status: 'completed', resultPath, completedAt: new Date() },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.db.reportRun.update({
        where: { id: runId },
        data: { status: 'failed', error: message, completedAt: new Date() },
      });
    } finally {
      if (uploadPath) await unlink(uploadPath).catch(() => undefined);
    }
  }
}
