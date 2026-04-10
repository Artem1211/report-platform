export type SourceType = 'sql' | 'api' | 'file';

export interface FormValues {
  name: string;
  description: string;
  sourceType: SourceType;
  db: string;
  query: string;
  url: string;
}
