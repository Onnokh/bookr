import { describe, expect, it } from 'vitest';
import { getTodayISO, getYesterdayISO, roundToNearest15Minutes } from '../../src/utils/date.js';

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

describe('roundToNearest15Minutes', () => {
  it('should round down to the previous 15-minute mark', () => {
    // Test cases: [input minutes, expected rounded minutes]
    const testCases = [
      [0, 0],    // 12:00 -> 12:00
      [7, 0],    // 12:07 -> 12:00
      [8, 0],    // 12:08 -> 12:00
      [14, 0],   // 12:14 -> 12:00
      [15, 15],  // 12:15 -> 12:15
      [22, 15],  // 12:22 -> 12:15
      [23, 15],  // 12:23 -> 12:15
      [29, 15],  // 12:29 -> 12:15
      [30, 30],  // 12:30 -> 12:30
      [37, 30],  // 12:37 -> 12:30
      [38, 30],  // 12:38 -> 12:30
      [44, 30],  // 12:44 -> 12:30
      [45, 45],  // 12:45 -> 12:45
      [52, 45],  // 12:52 -> 12:45
      [53, 45],  // 12:53 -> 12:45
      [59, 45],  // 12:59 -> 12:45
    ];

    for (const [inputMinutes, expectedMinutes] of testCases) {
      const date = new Date(2024, 0, 1, 12, inputMinutes, 30, 500); // 12:XX:30.500
      const rounded = roundToNearest15Minutes(date);
      
      expect(rounded.getMinutes()).toBe(expectedMinutes);
      expect(rounded.getSeconds()).toBe(0);
      expect(rounded.getMilliseconds()).toBe(0);
      
      // Hour should never change when rounding down
      expect(rounded.getHours()).toBe(12);
    }
  });

  it('should handle edge cases around midnight', () => {
    // 23:59 -> 23:45 (same day, rounded down)
    const date = new Date(2024, 0, 1, 23, 59, 30, 500);
    const rounded = roundToNearest15Minutes(date);
    
    expect(rounded.getHours()).toBe(23);
    expect(rounded.getMinutes()).toBe(45);
    expect(rounded.getDate()).toBe(1); // Same day
  });
});
