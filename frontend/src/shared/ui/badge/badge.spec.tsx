import { render, screen } from '@testing-library/react';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge variant="success">завершён</Badge>);
    expect(screen.getByText('завершён')).toBeInTheDocument();
  });

  it.each(['success', 'warning', 'error', 'neutral'] as const)(
    'renders without crashing for variant %s',
    (variant) => {
      const { container } = render(<Badge variant={variant}>label</Badge>);
      expect(container.firstChild).toBeTruthy();
    },
  );
});
