#!/usr/bin/env node

import { createJiraClientFromEnv } from '../api/jira-client.js';

async function listRecentIssues() {
  console.log('🔍 Fetching your recent JIRA issues...\n');

  try {
    const client = createJiraClientFromEnv();

    // Test connection first
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.log('❌ Failed to connect to JIRA');
      return;
    }

    console.log('✅ Connected to JIRA successfully!\n');

    // Get current user
    const user = await client.getCurrentUser();
    console.log(`👤 Logged in as: ${user.displayName}\n`);

    // Get recent issues assigned to you
    console.log('📋 Your recent issues:');
    try {
      const issues = await client.getMyRecentIssues(10);

      if (issues.length === 0) {
        console.log('   No recent issues found assigned to you.');
        console.log('   Try searching for issues you have access to in your JIRA instance.\n');
      } else {
        issues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue.key} - ${issue.fields.summary}`);
          console.log(
            `      Status: ${issue.fields.status.name} | Project: ${issue.fields.project.name}`
          );
        });

        console.log('\n💡 To test the CLI with one of these issues:');
        console.log('1. Create a branch with the issue key:');
        const firstIssue = issues[0];
        if (firstIssue) {
          console.log(`   git checkout -b feature/${firstIssue.key}-test-integration`);
          console.log('2. Run the CLI:');
          console.log(`   npm run dev -- 1h -m "Working on ${firstIssue.key}"`);
        }
      }
    } catch (searchError) {
      console.log('⚠️  Could not fetch recent issues:');
      console.log(`   ${searchError instanceof Error ? searchError.message : 'Unknown error'}`);
      console.log('\n💡 You can still test by:');
      console.log('1. Going to your JIRA instance');
      console.log('2. Finding any issue you have access to');
      console.log('3. Using its key in a branch name');
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

listRecentIssues().catch(console.error);
