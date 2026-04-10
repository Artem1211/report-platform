import { Typography } from '../typography/typography';
import styles from './styles.module.scss';

interface Props {
  title: string;
  children: React.ReactNode;
}

export function MainLayout({ title, children }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Typography variant="h1">{title}</Typography>
      </div>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
