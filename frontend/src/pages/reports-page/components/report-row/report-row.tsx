import { Button, CircularProgress } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { DeleteTemplateButton } from '@/features/delete-template';
import { RunReportDialog } from '@/features/run-report';
import type { ReportTemplateDto } from '@/shared/api';
import { createRun } from '@/shared/api/methods/runs';
import { runQueries } from '@/shared/api/query/runs-queries';
import { Badge, ClampText } from '@/shared/ui';

import styles from './styles.module.scss';

interface Props {
  template: ReportTemplateDto;
}

export function ReportRow({ template }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const hasParams = Object.keys(template.paramsSchema).length > 0;

  const { mutate, isPending } = useMutation({
    mutationFn: () => createRun(template.id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: runQueries.all() });
      toast.info('Отчёт запущен');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Произошла ошибка');
    },
  });

  const handleRun = () => {
    if (hasParams) {
      setOpen(true);
    } else {
      mutate();
    }
  };

  const actions = (
    <div className={styles.actions}>
      <Button size="small" variant="outlined" onClick={handleRun} disabled={isPending}>
        {isPending ? <CircularProgress size={16} /> : 'Запустить'}
      </Button>
      <DeleteTemplateButton templateId={template.id} />
    </div>
  );

  return (
    <>
      <tr className={styles.row}>
        <td className={styles.actionsMobile}>{actions}</td>
        <td className={styles.cell}>
          <ClampText text={template.name} variant="body" />
        </td>
        <td className={styles.cell}>
          <ClampText text={template.description} variant="caption" />
        </td>
        <td className={styles.cell}>
          <Badge variant="neutral">{template.type}</Badge>
        </td>
        <td className={styles.actionsDesktop}>{actions}</td>
      </tr>
      <RunReportDialog template={template} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
