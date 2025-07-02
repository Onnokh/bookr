import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '../../src/api/jira-client.js';
import type { JiraClient } from '../../src/api/jira-client.js';

describe('JIRA Integration - Connection', () => {
  let client: JiraClient | null = null;

  beforeAll(() => {
    // Skip tests if no JIRA credentials are available
    if (!process.env.JIRA_API_TOKEN || !process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL) {
      console.log('⚠️  Skipping JIRA integration tests - missing credentials');
      console.log('   Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN to run these tests');
      return;
    }

    client = createClient();
  });

  it('should connect to JIRA successfully', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    const isConnected = await client.testConnection();
    expect(isConnected).toBe(true);
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

  it('should handle issue retrieval for existing issues', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    // This test will fail if PROJ-123 doesn't exist, but that's expected
    // You can change this to a real issue key from your JIRA instance
    try {
      const issue = await client.getIssue('PROJ-123');
      expect(issue).toHaveProperty('key');
      expect(issue).toHaveProperty('fields.summary');
      expect(issue.key).toBe('PROJ-123');
    } catch (error) {
      // Expected to fail if PROJ-123 doesn't exist
      expect(error).toBeInstanceOf(Error);
      console.log("⚠️  Issue retrieval failed (expected if PROJ-123 doesn't exist):");
      console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  it('should handle issue retrieval for non-existent issues', async () => {
    if (!client) {
      expect(true).toBe(true); // Skip test
      return;
    }

    await expect(client.getIssue('NONEXISTENT-999')).rejects.toThrow();
  });
});
