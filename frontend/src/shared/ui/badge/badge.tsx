import classNames from 'classnames';

import { Typography } from '../typography';
import styles from './styles.module.scss';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral';

interface Props {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant, children }: Props) {
  return (
    <span className={classNames(styles.badge, styles[variant])}>
      <Typography variant="action">{children}</Typography>
    </span>
  );
}
