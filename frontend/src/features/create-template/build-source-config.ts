import type { CreateTemplateDto } from '@/shared/api';

import type { FormValues } from './types';

export function buildSourceConfig(
  values: FormValues,
  dateField?: string,
): CreateTemplateDto['sourceConfig'] {
  if (values.sourceType === 'sql') {
    return {
      type: 'sql',
      db: values.db,
      ...(values.query.trim() && { query: values.query.trim() }),
      ...(dateField && { dateField }),
    };
  }
  if (values.sourceType === 'api') {
    return { type: 'api', url: values.url };
  }
  return { type: 'file' };
}
