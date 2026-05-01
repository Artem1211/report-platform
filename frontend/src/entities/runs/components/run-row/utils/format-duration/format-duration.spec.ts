import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it('returns null when startedAt is missing', () => {
    expect(formatDuration(undefined, '2024-01-01T00:01:00.000Z')).toBeNull();
  });

  it('returns null when completedAt is missing', () => {
    expect(formatDuration('2024-01-01T00:00:00.000Z', undefined)).toBeNull();
  });

  it('returns null when both are missing', () => {
    expect(formatDuration()).toBeNull();
  });

  it('calculates duration in milliseconds', () => {
    const started = '2024-01-01T00:00:00.000Z';
    const completed = '2024-01-01T00:00:01.500Z';
    expect(formatDuration(started, completed)).toBe('1500 мс');
  });

  it('returns 0 мс for same timestamps', () => {
    const ts = '2024-01-01T00:00:00.000Z';
    expect(formatDuration(ts, ts)).toBe('0 мс');
  });
});
