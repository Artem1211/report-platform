import type { ReportRunDto } from '@/shared/api';

export type StatusVariant = 'success' | 'warning' | 'error' | 'neutral';

const map: Record<ReportRunDto['status'], StatusVariant> = {
  completed: 'success',
  running: 'warning',
  failed: 'error',
  pending: 'neutral',
};

export function getStatusVariant(status: ReportRunDto['status']): StatusVariant {
  return map[status];
}
