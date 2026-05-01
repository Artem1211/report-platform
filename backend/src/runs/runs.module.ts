import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { DynamicProcessor } from './dynamic-processor';
import { RUNS_QUEUE, RunWorker } from './run.worker';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';
import { StorageService } from './storage.service';
import { XlsxRenderer } from './xlsx.renderer';

@Module({
  imports: [
    BullModule.registerQueue({ name: RUNS_QUEUE }),
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [RunsController],
  providers: [RunsService, RunWorker, DynamicProcessor, XlsxRenderer, StorageService],
})
export class RunsModule {}
