import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

import type { SourceConfig } from '../runs/run.types';

export class ParamsFieldSchemaDto {
  @ApiProperty({ enum: ['date', 'select', 'number', 'file'] })
  type!: 'date' | 'select' | 'number' | 'file';

  @ApiProperty()
  label!: string;

  @ApiProperty()
  required!: boolean;

  @ApiProperty({ required: false })
  default?: number;
}

export class ReportTemplateDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(ParamsFieldSchemaDto) },
  })
  paramsSchema!: unknown;

  @ApiProperty({ type: 'object', additionalProperties: true })
  sourceConfig!: SourceConfig;

  @ApiProperty()
  createdAt!: string;
}

export class CreateTemplateDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  sourceConfig!: SourceConfig;
}

export class TemplateSourceDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ enum: ['clickhouse', 'postgres'] })
  engine!: 'clickhouse' | 'postgres';

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  defaultQuery?: string;

  @ApiProperty({ required: false })
  dateField?: string;
}
