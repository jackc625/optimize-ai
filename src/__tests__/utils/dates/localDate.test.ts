import { describe, it, expect } from 'vitest';
import { getLocalDate, formatLocalDate } from '@/utils/dates/localDate';

describe('getLocalDate', () => {
  it('returns string matching yyyy-MM-dd pattern', () => {
    const result = getLocalDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatLocalDate', () => {
  it('formats Jan 15 2026 as 2026-01-15', () => {
    expect(formatLocalDate(new Date(2026, 0, 15))).toBe('2026-01-15');
  });
  it('formats Dec 31 2026 as 2026-12-31', () => {
    expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
  it('zero-pads single-digit months and days', () => {
    expect(formatLocalDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});
