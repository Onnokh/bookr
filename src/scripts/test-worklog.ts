#!/usr/bin/env node

import { createJiraClientFromEnv } from '../api/jira-client.js';
import { parseTimeToSeconds, secondsToJiraFormat, formatJiraDate } from '../utils/time-parser.js';

async function testWorklogCreation() {
  console.log('🧪 Testing worklog creation...\n');
  
  try {
    const client = createJiraClientFromEnv();
    
    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.log('❌ Failed to connect to JIRA');
      return;
    }
    
    console.log('✅ Connected to JIRA successfully!\n');
    
    // Test with a simple worklog
    const issueKey = 'WILLEMII-62';
    const timeString = '30m';
    const timeSpentSeconds = parseTimeToSeconds(timeString);
    const jiraTimeFormat = secondsToJiraFormat(timeSpentSeconds);
    
    console.log('📋 Worklog details:');
    console.log(`   Issue: ${issueKey}`);
    console.log(`   Time string: ${timeString}`);
    console.log(`   Time in seconds: ${timeSpentSeconds}`);
    console.log(`   JIRA format: ${jiraTimeFormat}`);
    console.log(`   Comment: Test worklog from Bookr CLI\n`);
    
    // Use the JIRA client with the correct format
    const worklog = {
      timeSpent: jiraTimeFormat,
      comment: 'Test worklog from Bookr CLI',
      started: formatJiraDate(new Date())
    };
    
    console.log('📤 Sending worklog request...');
    const result = await client.addWorklog(issueKey, worklog);
    
    console.log('✅ Worklog created successfully!');
    console.log(`   Worklog ID: ${result.id}`);
    console.log(`   Time spent: ${result.timeSpent}`);
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

testWorklogCreation().catch(console.error); 