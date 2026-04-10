import { Tooltip } from '@mui/material';
import { DownloadSimple, WarningCircle } from '@phosphor-icons/react';

import type { ReportRunDto } from '@/shared/api';
import { API_URL } from '@/shared/api/config';
import { Badge, ClampText, Typography } from '@/shared/ui';

import styles from './styles.module.scss';
import { formatDate } from './utils/format-date';
import { formatDuration } from './utils/format-duration';
import { getStatusLabel } from './utils/get-status-label';
import { getStatusVariant } from './utils/get-status-variant';

interface Props {
  run: ReportRunDto;
  templateName?: string;
}

export function RunRow({ run, templateName }: Props) {
  const duration = formatDuration(run.startedAt, run.completedAt);

  const actions = (
    <>
      {run.status === 'completed' && (
        <a href={`${API_URL}/runs/${run.id}/download`} download className={styles.downloadBtn}>
          <DownloadSimple size={16} weight="bold" />
          <Typography variant="action">Скачать</Typography>
        </a>
      )}
      {run.status === 'failed' && run.error && (
        <Tooltip title={run.error} arrow placement="top">
          <span className={styles.errorIcon}>
            <WarningCircle size={16} weight="fill" />
          </span>
        </Tooltip>
      )}
    </>
  );

  return (
    <tr className={styles.row}>
      <td className={styles.actionsMobile}>{actions}</td>
      <td className={styles.cell}>
        <ClampText text={templateName ?? run.id.slice(0, 8)} variant="caption" />
      </td>
      <td className={styles.cell}>
        <Badge variant={getStatusVariant(run.status)}>{getStatusLabel(run.status)}</Badge>
      </td>
      <td className={styles.dateCell}>
        <Typography variant="caption">{formatDate(run.startedAt)}</Typography>
      </td>
      <td className={styles.dateCell}>
        <Typography variant="caption">
          {formatDate(run.completedAt)}
          {duration && <span> ({duration})</span>}
        </Typography>
      </td>
      <td className={styles.actionsDesktop}>{actions}</td>
    </tr>
  );
}
