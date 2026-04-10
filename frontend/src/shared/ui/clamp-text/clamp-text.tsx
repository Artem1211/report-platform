import { Tooltip } from '@mui/material';
import { useLayoutEffect, useRef, useState } from 'react';

import { Typography } from '../typography/typography';
import styles from './styles.module.scss';

interface Props {
  text?: string | null;
  lines?: number;
  variant?: 'body' | 'caption' | 'action';
}

export function ClampText({ text, lines = 2, variant = 'body' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, [text, lines]);

  if (!text) return <Typography variant={variant}>—</Typography>;

  const inner = (
    <div ref={ref} className={styles.clamp} style={{ WebkitLineClamp: lines }}>
      <Typography variant={variant}>{text}</Typography>
    </div>
  );

  if (!isClamped) return inner;

  return (
    <Tooltip
      title={text}
      placement="top"
      enterTouchDelay={0}
      slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -8] } }] } }}
    >
      {inner}
    </Tooltip>
  );
}
