import { createClient } from '../api/jira-client.js';
import { extractCommentText } from '../utils/jira.js';
import { secondsToJiraFormat } from '../utils/time-parser.js';
import { getTodaysStoredWorklogs } from '../utils/worklog-storage.js';

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
    // Get stored worklogs for showing IDs
    const storedWorklogs = getTodaysStoredWorklogs();
    const storedWorklogMap = new Map(storedWorklogs.map((w) => [w.id, w]));

    // Calculate total time and display worklogs
    let totalSeconds = 0;
    console.log('─'.repeat(120));
    console.log(`${'ID'.padEnd(17)} | ${'Issue'.padEnd(12)} | ${'Time'.padEnd(8)} | Summary`);
    console.log('─'.repeat(120));

    for (const { issue, worklog } of todayWorklogs) {
      const timeSpent = worklog.timeSpentSeconds || 0;
      totalSeconds += timeSpent;
      const timeDisplay = secondsToJiraFormat(timeSpent);
      const comment = extractCommentText(worklog.comment);

      // Show worklog ID - all worklogs can be undone, but indicate source
      const worklogId = worklog.id || 'N/A';
      const isStoredWorklog = storedWorklogMap.has(worklogId);
      const source = isStoredWorklog ? ' (bookr)' : '';

      console.log(
        `${(worklogId + source).padEnd(17)} | ${issue.key.padEnd(12)} | ${timeDisplay.padEnd(8)} | ${issue.fields.summary}`
      );

      if (comment && comment !== 'No comment') {
        console.log(`${' '.repeat(42)} └─ ${comment}`);
      }
    }
    console.log('─'.repeat(120));
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
