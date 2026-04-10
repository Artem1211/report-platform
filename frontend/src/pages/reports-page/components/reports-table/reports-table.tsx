import { Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { CreateTemplateDialog } from '@/features/create-template';
import { reportQueries } from '@/shared/api/query/reports-queries';
import { Typography } from '@/shared/ui';

import { ReportRow } from '../report-row';
import { SkeletonRows } from '../skeleton-rows';
import styles from './styles.module.scss';

export function ReportsTable() {
  const { data, isLoading, isError } = useQuery(reportQueries.list());
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="contained" size="small" onClick={() => setCreateOpen(true)}>
          Новый шаблон
        </Button>
      </div>
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thActionsMobile} />
              <th className={styles.th}>
                <Typography variant="caption">Название</Typography>
              </th>
              <th className={styles.th}>
                <Typography variant="caption">Описание</Typography>
              </th>
              <th className={styles.th}>
                <Typography variant="caption">id</Typography>
              </th>
              <th className={styles.thActionsDesktop} />
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonRows />}
            {isError && (
              <tr>
                <td colSpan={4} className={styles.errorCell}>
                  <Typography variant="body">Не удалось загрузить шаблоны</Typography>
                </td>
              </tr>
            )}
            {data?.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.infoCell}>
                  <Typography variant="body">Шаблонов пока нет. Создайте первый!</Typography>
                </td>
              </tr>
            )}
            {data?.map((template) => (
              <ReportRow key={template.id} template={template} />
            ))}
          </tbody>
        </table>
      </div>
      <CreateTemplateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
