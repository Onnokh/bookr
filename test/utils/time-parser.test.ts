import {
  formatJiraDate,
  formatTimeForDisplay,
  isValidTimeFormat,
  parseTimeToSeconds,
  secondsToJiraFormat,
} from '@/utils/time-parser.js';
import { describe, expect, it } from 'vitest';

describe('parseTimeToSeconds', () => {
  it('should parse decimal hours correctly', () => {
    expect(parseTimeToSeconds('2.5h')).toBe(9000); // 2.5 * 3600
    expect(parseTimeToSeconds('1.25h')).toBe(4500); // 1.25 * 3600
    expect(parseTimeToSeconds('0.5h')).toBe(1800); // 0.5 * 3600
  });

  it('should parse hours and minutes correctly', () => {
    expect(parseTimeToSeconds('2h30m')).toBe(9000); // 2*3600 + 30*60
    expect(parseTimeToSeconds('1h15m')).toBe(4500); // 1*3600 + 15*60
    expect(parseTimeToSeconds('0h45m')).toBe(2700); // 0*3600 + 45*60
  });

  it('should parse hours only correctly', () => {
    expect(parseTimeToSeconds('2h')).toBe(7200);
    expect(parseTimeToSeconds('1h')).toBe(3600);
    expect(parseTimeToSeconds('0h')).toBe(0);
  });

  it('should parse minutes only correctly', () => {
    expect(parseTimeToSeconds('30m')).toBe(1800);
    expect(parseTimeToSeconds('45m')).toBe(2700);
    expect(parseTimeToSeconds('0m')).toBe(0);
  });

  it('should handle case insensitive input', () => {
    expect(parseTimeToSeconds('2H30M')).toBe(9000);
    expect(parseTimeToSeconds('1H15M')).toBe(4500);
  });

  it('should handle whitespace', () => {
    expect(parseTimeToSeconds(' 2h30m ')).toBe(9000);
    expect(parseTimeToSeconds('1h 15m')).toBe(4500);
  });
});

describe('secondsToJiraFormat', () => {
  it('should format hours and minutes correctly', () => {
    expect(secondsToJiraFormat(9000)).toBe('2h 30m');
    expect(secondsToJiraFormat(4500)).toBe('1h 15m');
    expect(secondsToJiraFormat(3900)).toBe('1h 5m');
  });

  it('should format hours only correctly', () => {
    expect(secondsToJiraFormat(7200)).toBe('2h');
    expect(secondsToJiraFormat(3600)).toBe('1h');
    expect(secondsToJiraFormat(0)).toBe('0m');
  });

  it('should format minutes only correctly', () => {
    expect(secondsToJiraFormat(1800)).toBe('30m');
    expect(secondsToJiraFormat(2700)).toBe('45m');
    expect(secondsToJiraFormat(60)).toBe('1m');
  });
});

describe('isValidTimeFormat', () => {
  it('should validate decimal hours', () => {
    expect(isValidTimeFormat('2.5h')).toBe(true);
    expect(isValidTimeFormat('1.25h')).toBe(true);
    expect(isValidTimeFormat('0.5h')).toBe(true);
    expect(isValidTimeFormat('2.5')).toBe(true); // h is optional for decimal hours
  });

  it('should validate hours and minutes', () => {
    expect(isValidTimeFormat('2h30m')).toBe(true);
    expect(isValidTimeFormat('1h15m')).toBe(true);
    expect(isValidTimeFormat('0h45m')).toBe(true);
  });

  it('should validate hours only', () => {
    expect(isValidTimeFormat('2h')).toBe(true);
    expect(isValidTimeFormat('1h')).toBe(true);
    expect(isValidTimeFormat('0h')).toBe(true);
  });

  it('should validate minutes only', () => {
    expect(isValidTimeFormat('30m')).toBe(true);
    expect(isValidTimeFormat('45m')).toBe(true);
    expect(isValidTimeFormat('0m')).toBe(true);
  });

  it('should reject invalid formats', () => {
    expect(isValidTimeFormat('2h30')).toBe(false);
    expect(isValidTimeFormat('abc')).toBe(false);
    expect(isValidTimeFormat('')).toBe(false);
    expect(isValidTimeFormat('2h30s')).toBe(false);
    expect(isValidTimeFormat('2.5h30m')).toBe(false);
  });
});

describe('formatTimeForDisplay', () => {
  it('should format hours and minutes for display', () => {
    expect(formatTimeForDisplay('2h30m')).toBe('2 hours and 30 minutes');
    expect(formatTimeForDisplay('1h15m')).toBe('1 hour and 15 minutes');
    expect(formatTimeForDisplay('0h45m')).toBe('45 minutes');
  });

  it('should format hours only for display', () => {
    expect(formatTimeForDisplay('2h')).toBe('2 hours');
    expect(formatTimeForDisplay('1h')).toBe('1 hour');
    expect(formatTimeForDisplay('0h')).toBe('0 minutes');
  });

  it('should format minutes only for display', () => {
    expect(formatTimeForDisplay('30m')).toBe('30 minutes');
    expect(formatTimeForDisplay('1m')).toBe('1 minute');
    expect(formatTimeForDisplay('0m')).toBe('0 minutes');
  });
});

describe('formatJiraDate', () => {
  it('should format date in JIRA format', () => {
    const date = new Date('2024-01-15T10:30:45.123Z');
    const formatted = formatJiraDate(date);

    // The exact format depends on timezone, so we'll test the structure
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
  });

  it('should handle different dates', () => {
    const date1 = new Date('2024-12-31T23:59:59.999Z');
    const date2 = new Date('2024-01-01T00:00:00.000Z');

    expect(formatJiraDate(date1)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
    expect(formatJiraDate(date2)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
  });
});
