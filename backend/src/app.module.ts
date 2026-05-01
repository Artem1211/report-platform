import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DatabaseModule } from './database';
import { DatasourceModule } from './datasource';
import { ReportsModule } from './reports';
import { RunsModule } from './runs';

@Module({
  imports: [
    DatabaseModule,
    DatasourceModule,
    BullModule.forRootAsync({
      useFactory: () => {
        const { hostname, port } = new URL(process.env['REDIS_URL'] ?? 'redis://localhost:6379');
        return { connection: { host: hostname, port: Number(port) || 6379 } };
      },
    }),
    ReportsModule,
    RunsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
