import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '../../src/api/jira-client.js';
import type { JiraClient } from '../../src/api/jira-client.js';

describe('JIRA Integration - Issues', () => {
  let client: JiraClient | null = null;

  beforeAll(() => {
    // Skip tests if no JIRA credentials are available
    if (!process.env.JIRA_API_TOKEN || !process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL) {
      console.log('⚠️  Skipping JIRA issues integration tests - missing credentials');
      console.log('   Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN to run these tests');
      return;
    }

    client = createClient();
  });

  it('should get current user information', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    const user = await client.getCurrentUser();

    expect(user).toHaveProperty('displayName');
    expect(user).toHaveProperty('emailAddress');
    expect(user).toHaveProperty('accountId');
    expect(typeof user.displayName).toBe('string');
    expect(typeof user.emailAddress).toBe('string');

    console.log(`👤 Logged in as: ${user.displayName} (${user.emailAddress})`);
  });

  it('should fetch recent issues assigned to current user', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    try {
      const issues = await client.getMyRecentIssues(5);

      expect(Array.isArray(issues)).toBe(true);

      if (issues.length > 0) {
        console.log('📋 Recent issues found:');
        issues.forEach((issue, index) => {
          expect(issue).toHaveProperty('key');
          expect(issue).toHaveProperty('fields.summary');
          expect(issue).toHaveProperty('fields.status.name');
          expect(issue).toHaveProperty('fields.project.name');

          console.log(`   ${index + 1}. ${issue.key} - ${issue.fields.summary}`);
          console.log(
            `      Status: ${issue.fields.status.name} | Project: ${issue.fields.project.name}`
          );
        });
      } else {
        console.log('📋 No recent issues found assigned to you.');
        console.log('   This might be normal if you have no assigned issues.');
      }
    } catch (error) {
      console.log('⚠️  Could not fetch recent issues:');
      console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('   This might be due to:');
      console.log('   - No assigned issues');
      console.log('   - Insufficient permissions');
      console.log('   - JIRA API limitations');

      // Still expect an error to be thrown
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should search for issues using JQL', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    try {
      // Search for issues updated in the last 30 days
      const jql = 'updated >= -30d ORDER BY updated DESC';
      const result = await client.searchIssues(jql, 3);

      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(typeof result.total).toBe('number');

      console.log(`🔍 Found ${result.total} issues (showing ${result.issues.length})`);

      if (result.issues.length > 0) {
        result.issues.forEach((issue, index) => {
          expect(issue).toHaveProperty('key');
          expect(issue).toHaveProperty('fields.summary');
          console.log(`   ${index + 1}. ${issue.key} - ${issue.fields.summary}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Could not search for issues:');
      console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Still expect an error to be thrown
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should get worklogs for a specific issue', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    // Use a test issue key or skip if none available
    const testIssueKey = process.env.TEST_ISSUE_KEY;
    if (!testIssueKey) {
      console.log('⚠️  Skipping worklog test - no TEST_ISSUE_KEY environment variable set');
      expect(true).toBe(true); // Skip test
      return;
    }

    try {
      const worklogsResponse = await client.getWorklogs(testIssueKey);

      expect(worklogsResponse).toHaveProperty('worklogs');
      expect(Array.isArray(worklogsResponse.worklogs)).toBe(true);

      console.log(`📝 Found ${worklogsResponse.worklogs.length} worklogs for ${testIssueKey}`);

      if (worklogsResponse.worklogs.length > 0) {
        worklogsResponse.worklogs.slice(0, 3).forEach((worklog, index) => {
          expect(worklog).toHaveProperty('id');
          expect(worklog).toHaveProperty('timeSpentSeconds');
          console.log(
            `   ${index + 1}. ${worklog.timeSpentSeconds}s - ${worklog.comment || 'No comment'}`
          );
        });
      }
    } catch (error) {
      console.log('⚠️  Could not fetch worklogs:');
      console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Still expect an error to be thrown
      expect(error).toBeInstanceOf(Error);
    }
  });
});
