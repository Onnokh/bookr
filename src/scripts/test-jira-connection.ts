#!/usr/bin/env node

import { createJiraClientFromEnv } from '../api/jira-client.js';

async function testJiraConnection() {
  console.log('🔗 Testing JIRA connection...\n');

  try {
    const client = createJiraClientFromEnv();

    // Test basic connection
    console.log('1. Testing connection...');
    const isConnected = await client.testConnection();

    if (isConnected) {
      console.log('✅ Connection successful!\n');

      // Get current user info
      console.log('2. Getting current user...');
      const user = await client.getCurrentUser();
      console.log(`✅ Logged in as: ${user.displayName} (${user.emailAddress})\n`);

      // Test getting a sample issue (you can change this to a real issue key)
      console.log('3. Testing issue retrieval...');
      console.log("Note: This will fail if PROJ-123 doesn't exist in your JIRA instance");

      try {
        const issue = await client.getIssue('PROJ-123');
        console.log(`✅ Found issue: ${issue.key} - ${issue.fields.summary}`);
      } catch (error) {
        console.log("⚠️  Issue retrieval failed (this is expected if PROJ-123 doesn't exist):");
        console.log(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      console.log('\n🎉 JIRA connection is working! Your credentials are valid.');
    } else {
      console.log('❌ Connection failed!');
      console.log('Please check your JIRA credentials in the .env file.');
    }
  } catch (error) {
    console.log('❌ Error setting up JIRA client:');
    console.log(error instanceof Error ? error.message : 'Unknown error');
    console.log('\nPlease check your .env file contains:');
    console.log('- JIRA_BASE_URL');
    console.log('- JIRA_EMAIL');
    console.log('- JIRA_API_TOKEN');
  }
}

testJiraConnection().catch(console.error);
