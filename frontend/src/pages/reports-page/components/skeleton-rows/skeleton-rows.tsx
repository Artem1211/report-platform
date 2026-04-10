import { Skeleton } from '@mui/material';

import styles from './styles.module.scss';

export function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <tr key={i} className={styles.row}>
          <td className={styles.cell}>
            <Skeleton height="16px" width="60%" />
          </td>
          <td className={styles.cell}>
            <Skeleton height="22px" width="80px" />
          </td>
          <td className={styles.cell}>
            <Skeleton height="16px" width="100px" />
          </td>
        </tr>
      ))}
    </>
  );
}
