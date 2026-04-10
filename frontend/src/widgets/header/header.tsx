import classNames from 'classnames';
import { NavLink } from 'react-router-dom';

import { Typography } from '@/shared/ui';

import styles from './styles.module.scss';

const links = [
  { to: '/', label: 'Шаблоны' },
  { to: '/runs', label: 'Запуски' },
];

export function Header() {
  return (
    <header className={styles.wrapper}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => classNames(styles.link, { [styles.active!]: isActive })}
            >
              <Typography variant="action">{label}</Typography>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
