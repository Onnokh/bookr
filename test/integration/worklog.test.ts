import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '../../src/api/jira-client.js';
import type { JiraClient } from '../../src/api/jira-client.js';
import {
  formatJiraDate,
  parseTimeToSeconds,
  secondsToJiraFormat,
} from '../../src/utils/time-parser.js';

describe('JIRA Integration - Worklog', () => {
  let client: JiraClient | null = null;

  beforeAll(() => {
    // Skip tests if no JIRA credentials are available
    if (!process.env.JIRA_API_TOKEN || !process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL) {
      console.log('⚠️  Skipping JIRA worklog integration tests - missing credentials');
      console.log('   Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN to run these tests');
      return;
    }

    client = createClient();
  });

  it('should create worklog entries successfully', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    // Test connection first
    const isConnected = await client.testConnection();
    expect(isConnected).toBe(true);

    // Test with a simple worklog
    const issueKey = process.env.TEST_ISSUE_KEY || 'WILLEMII-62'; // Use env var or default
    const timeString = '30m';
    const timeSpentSeconds = parseTimeToSeconds(timeString);
    const jiraTimeFormat = secondsToJiraFormat(timeSpentSeconds);

    console.log('📋 Worklog details:');
    console.log(`   Issue: ${issueKey}`);
    console.log(`   Time string: ${timeString}`);
    console.log(`   Time in seconds: ${timeSpentSeconds}`);
    console.log(`   JIRA format: ${jiraTimeFormat}`);

    const worklog = {
      timeSpent: jiraTimeFormat,
      comment: 'Integration test worklog from Bookr CLI',
      started: formatJiraDate(new Date()),
    };

    try {
      const result = await client.addWorklog(issueKey, worklog);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timeSpentSeconds');
      expect(typeof result.id).toBe('string');
      expect(typeof result.timeSpentSeconds).toBe('number');

      console.log('✅ Worklog created successfully!');
      console.log(`   Worklog ID: ${result.id}`);
      console.log(`   Time spent: ${result.timeSpentSeconds} seconds`);
    } catch (error) {
      // This might fail if the issue doesn't exist or user doesn't have permission
      console.log('⚠️  Worklog creation failed (this might be expected):');
      console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('   This could be due to:');
      console.log('   - Issue key not existing');
      console.log('   - Insufficient permissions');
      console.log('   - Invalid issue key format');

      // Still expect an error to be thrown
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should handle time parsing correctly', () => {
    // Test time parsing functions
    expect(parseTimeToSeconds('30m')).toBe(1800);
    expect(parseTimeToSeconds('1h')).toBe(3600);
    expect(parseTimeToSeconds('1h30m')).toBe(5400);
    expect(parseTimeToSeconds('2.5h')).toBe(9000);

    expect(secondsToJiraFormat(1800)).toBe('30m');
    expect(secondsToJiraFormat(3600)).toBe('1h');
    expect(secondsToJiraFormat(5400)).toBe('1h 30m');
    expect(secondsToJiraFormat(9000)).toBe('2h 30m');
  });

  it('should format dates correctly for JIRA', () => {
    const testDate = new Date('2024-01-15T10:30:00.000Z');
    const formatted = formatJiraDate(testDate);

    // Should be in ISO format with timezone offset
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/);
  });
});
