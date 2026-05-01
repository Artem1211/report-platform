import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class ReportRunDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  templateId!: string;

  @ApiProperty({ enum: ['pending', 'running', 'completed', 'failed'] })
  status!: string;

  @ApiProperty({ required: false })
  resultPath?: string;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({ required: false })
  startedAt?: string;

  @ApiProperty({ required: false })
  completedAt?: string;

  @ApiProperty()
  createdAt!: string;
}

export class RunReportDto {
  @ApiProperty({ description: 'Report run parameters (dateFrom, dateTo, etc.)' })
  @IsObject()
  params!: Record<string, unknown>;
}
