import { getStatusLabel } from './get-status-label';

describe('getStatusLabel', () => {
  it.each([
    ['completed', 'завершён'],
    ['running', 'выполняется'],
    ['failed', 'ошибка'],
    ['pending', 'ожидает'],
  ] as const)('maps %s → %s', (status, expected) => {
    expect(getStatusLabel(status)).toBe(expected);
  });
});
