import { getStatusVariant } from './get-status-variant';

describe('getStatusVariant', () => {
  it.each([
    ['completed', 'success'],
    ['running', 'warning'],
    ['failed', 'error'],
    ['pending', 'neutral'],
  ] as const)('maps %s → %s', (status, expected) => {
    expect(getStatusVariant(status)).toBe(expected);
  });
});
