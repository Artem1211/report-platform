export type ReportStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportData {
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

// Extension point: add new source type variant here, then handle it in DynamicProcessor.run()
export type SourceConfig =
  | { type: 'sql'; db: string; query?: string; dateField?: string }
  | { type: 'api'; url: string }
  | { type: 'file' };
