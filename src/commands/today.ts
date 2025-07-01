import { createClient } from '../api/jira-client.js';
import { extractCommentText } from '../utils/jira.js';
import { secondsToJiraFormat } from '../utils/time-parser.js';

export async function showTodayWorklogs() {
  try {
    const client = createClient();
    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.log('❌ Failed to connect to JIRA');
      return;
    }
    // Get today's worklogs
    const todayWorklogs = await client.getTodayWorklogs();
    if (todayWorklogs.length === 0) {
      console.log('📭 No worklogs found for today.');
      return;
    }
    // Calculate total time
    let totalSeconds = 0;
    console.log('─'.repeat(80));
    for (const { issue, worklog } of todayWorklogs) {
      const timeSpent = worklog.timeSpentSeconds || 0;
      totalSeconds += timeSpent;
      const timeDisplay = secondsToJiraFormat(timeSpent);
      //   const started = worklog.started ? new Date(worklog.started).toLocaleTimeString() : 'N/A';
      const comment = extractCommentText(worklog.comment);
      console.log(`${issue.key.padEnd(12)} | ${issue.fields.summary}`);
      if (comment && comment !== 'No comment') {
        console.log(`${timeDisplay.padEnd(12)} - ${comment}`);
      }
      console.log('');
    }
    console.log('─'.repeat(80));
    const totalTime = secondsToJiraFormat(totalSeconds);
    const totalHours = (totalSeconds / 3600).toFixed(2);
    console.log(`📊 Total time today: ${totalTime} (${totalHours} hours)`);
    // Show some stats
    const uniqueIssues = new Set(todayWorklogs.map((w) => w.issue.key)).size;
    console.log(`📝 Worklog entries: ${todayWorklogs.length}`);
    console.log(`🎯 Issues worked on: ${uniqueIssues}`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Default export for CLI usage
export default showTodayWorklogs;

// For backward compatibility when running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  showTodayWorklogs().catch(console.error);
}
