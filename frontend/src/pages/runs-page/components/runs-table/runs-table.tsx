import { useQuery } from '@tanstack/react-query';

import { RunRow } from '@/entities/runs';
import { reportQueries } from '@/shared/api/query/reports-queries';
import { runQueries } from '@/shared/api/query/runs-queries';
import { Typography } from '@/shared/ui';

import { SkeletonRows } from '../skeleton-rows';
import styles from './styles.module.scss';

export function RunsTable() {
  const { data, isLoading, isError } = useQuery({
    ...runQueries.list(),
    refetchInterval: (query) => {
      const runs = query.state.data;
      return runs?.some((r) => r.status === 'pending' || r.status === 'running') ? 1000 : false;
    },
  });
  const { data: templates } = useQuery(reportQueries.list());

  const templateNameMap = new Map(templates?.map((t) => [t.id, t.name]) ?? []);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thActionsMobile} />
            <th className={styles.th}>
              <Typography variant="caption">Шаблон</Typography>
            </th>
            <th className={styles.th}>
              <Typography variant="caption">Статус</Typography>
            </th>
            <th className={styles.th}>
              <Typography variant="caption">Начало</Typography>
            </th>
            <th className={styles.th}>
              <Typography variant="caption">Завершение</Typography>
            </th>
            <th className={styles.thActionsDesktop} />
          </tr>
        </thead>
        <tbody>
          {isLoading && <SkeletonRows />}
          {isError && (
            <tr>
              <td colSpan={6} className={styles.errorCell}>
                <Typography variant="body">Не удалось загрузить запуски</Typography>
              </td>
            </tr>
          )}
          {data?.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.infoCell}>
                <Typography variant="body">Запусков пока нет</Typography>
              </td>
            </tr>
          )}
          {data?.map((run) => (
            <RunRow key={run.id} run={run} templateName={templateNameMap.get(run.templateId)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
