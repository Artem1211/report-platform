import classNames from 'classnames';

import styles from './styles.module.scss';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'action';

interface Props {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
}

const tagMap: Record<Variant, keyof React.JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  caption: 'span',
  action: 'span',
};

export function Typography({ variant, children, className }: Props) {
  const Tag = tagMap[variant];
  return <Tag className={classNames(styles[variant], className)}>{children}</Tag>;
}
