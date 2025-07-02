import { getTodayISO, getYesterdayISO } from '@/utils/date.js';
import { describe, expect, it } from 'vitest';

describe('Date Utils', () => {
  it("should return today's date in ISO format", () => {
    const today = new Date();
    const expected = today.toISOString().slice(0, 10);
    expect(getTodayISO()).toBe(expected);
  });

  it("should return yesterday's date in ISO format", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expected = yesterday.toISOString().slice(0, 10);
    expect(getYesterdayISO()).toBe(expected);
  });
});
