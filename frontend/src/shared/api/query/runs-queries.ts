import { queryOptions } from '@tanstack/react-query';

import { getRuns } from '../methods/runs';

export const runQueries = {
  all: () => ['runs'] as const,
  lists: () => [...runQueries.all(), 'list'] as const,
  list: () =>
    queryOptions({
      queryKey: runQueries.lists(),
      queryFn: getRuns,
    }),
};
