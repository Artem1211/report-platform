import { queryOptions } from '@tanstack/react-query';

import { getDatasources, getTemplates } from '../methods/reports';

export const reportQueries = {
  all: () => ['reports'] as const,
  lists: () => [...reportQueries.all(), 'list'] as const,
  list: () =>
    queryOptions({
      queryKey: reportQueries.lists(),
      queryFn: getTemplates,
    }),
  datasources: () =>
    queryOptions({
      queryKey: [...reportQueries.all(), 'datasources'] as const,
      queryFn: getDatasources,
    }),
};
