import { BookOpen } from '@phosphor-icons/react';

import { API_URL } from '@/shared/api/config';
import { Typography } from '@/shared/ui';

import styles from './styles.module.scss';
const SWAGGER_URL = `${API_URL}/docs`;
const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className={styles.wrapper}>
      <div className={styles.inner}>
        <Typography variant="caption">© {YEAR} Report Platform</Typography>
        <a href={SWAGGER_URL} target="_blank" rel="noreferrer" className={styles.link}>
          <BookOpen size={14} />
          <Typography variant="caption">API Docs</Typography>
        </a>
      </div>
    </footer>
  );
}
