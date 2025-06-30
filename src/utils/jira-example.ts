import { JiraClient, createJiraClientFromEnv } from '../api/jira-client.js';
import { JiraAuth } from '../types/jira.js';

/**
 * Example 1: Using environment variables (recommended for CLI tools)
 */
export async function exampleWithEnvVars() {
  try {
    const client = createJiraClientFromEnv();
    
    // Test connection
    const isConnected = await client.testConnection();
    console.log('Connection test:', isConnected ? '✅ Success' : '❌ Failed');
    
    if (isConnected) {
      // Get current user
      const user = await client.getCurrentUser();
      console.log('Current user:', user.displayName);
      
      // Get an issue
      const issue = await client.getIssue('PROJ-123');
      console.log('Issue:', issue.key, '-', issue.fields.summary);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 2: Using direct authentication
 */
export async function exampleWithDirectAuth() {
  const auth: JiraAuth = {
    baseUrl: 'https://your-domain.atlassian.net',
    email: 'your-email@example.com',
    apiToken: 'your-api-token-here'
  };
  
  const client = new JiraClient(auth);
  
  try {
    // Add a worklog entry
    const worklog = await client.addWorklog('PROJ-123', {
      timeSpent: '2h 30m',
      timeSpentSeconds: 9000, // 2.5 hours in seconds
      comment: 'Implemented new feature',
      started: new Date().toISOString()
    });
    
    console.log('Worklog added:', worklog.id);
  } catch (error) {
    console.error('Error adding worklog:', error instanceof Error ? error.message : error);
  }
}

/**
 * Example 3: Get worklogs for an issue
 */
export async function exampleGetWorklogs() {
  const client = createJiraClientFromEnv();
  
  try {
    const { worklogs } = await client.getWorklogs('PROJ-123');
    console.log(`Found ${worklogs.length} worklog entries:`);
    
    worklogs.forEach((worklog, index) => {
      console.log(`${index + 1}. ${worklog.timeSpent} - ${worklog.comment || 'No comment'}`);
    });
  } catch (error) {
    console.error('Error getting worklogs:', error instanceof Error ? error.message : error);
  }
} 