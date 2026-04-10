import { Global, Module } from '@nestjs/common';

import { DatasourceService } from './datasource.service';

@Global()
@Module({
  providers: [DatasourceService],
  exports: [DatasourceService],
})
export class DatasourceModule {}
