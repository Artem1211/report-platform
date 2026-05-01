import type { ReportRunDto } from '@/shared/api';

const map: Record<ReportRunDto['status'], string> = {
  completed: 'завершён',
  running: 'выполняется',
  failed: 'ошибка',
  pending: 'ожидает',
};

export function getStatusLabel(status: ReportRunDto['status']): string {
  return map[status];
}
