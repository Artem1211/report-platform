import { formatDate } from './format-date';

describe('formatDate', () => {
  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-03-15T10:30:00.000Z');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });

  it('includes time in the output', () => {
    const result = formatDate('2024-03-15T10:30:00.000Z');
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});
