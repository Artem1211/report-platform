import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { DatabaseModule } from './database';
import { DatasourceModule } from './datasource';
import { ReportsModule } from './reports';
import { RunsModule } from './runs';

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 60 }] }),
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
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
