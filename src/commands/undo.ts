import { createClient } from '../api/jira-client.js';
import { 
  getRecentStoredWorklogs, 
  getStoredWorklogById, 
  removeStoredWorklog
} from '../utils/worklog-storage.js';
import { secondsToJiraFormat } from '../utils/time-parser.js';

/**
 * Show interactive selection of recent worklogs to undo
 */
export async function showUndoSelection() {
  try {
    const client = createClient();
    
    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.log('❌ Failed to connect to JIRA');
      return;
    }

    const recentWorklogs = getRecentStoredWorklogs(7); // Last 7 days
    
    if (recentWorklogs.length === 0) {
      console.log('📭 No recent worklogs found to undo.');
      console.log('💡 Only worklogs created via bookr CLI can be undone.');
      return;
    }

    console.log('🔄 Recent worklogs that can be undone:');
    console.log('─'.repeat(120));
    console.log(`${'ID'.padEnd(15)} | ${'Issue'.padEnd(12)} | ${'Time'.padEnd(8)} | ${'Summary'.padEnd(50)} | Date`);
    console.log('─'.repeat(120));

    for (const worklog of recentWorklogs) {
      const date = new Date(worklog.started).toLocaleDateString();
      const time = new Date(worklog.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const timeDisplay = secondsToJiraFormat(worklog.timeSpentSeconds);
      const summary = worklog.issueSummary.length > 48 
        ? worklog.issueSummary.substring(0, 45) + '...' 
        : worklog.issueSummary;
      
      console.log(
        `${worklog.id.padEnd(15)} | ${worklog.issueKey.padEnd(12)} | ${timeDisplay.padEnd(8)} | ${summary.padEnd(50)} | ${date} ${time}`
      );
    }

    console.log('─'.repeat(120));
    console.log('');
    console.log('💡 To undo a specific worklog, run: bookr undo <WORKLOG_ID>');
    console.log('⚠️  Warning: This will permanently delete the worklog from JIRA!');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Undo a specific worklog by ID
 */
export async function undoWorklogById(worklogId: string) {
  try {
    const client = createClient();
    
    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.log('❌ Failed to connect to JIRA');
      return;
    }

    // Find the worklog in local storage
    const storedWorklog = getStoredWorklogById(worklogId);
    if (!storedWorklog) {
      console.log(`❌ Worklog with ID ${worklogId} not found in local storage.`);
      console.log('💡 Only worklogs created via bookr CLI can be undone.');
      console.log('💡 Run "bookr undo" to see available worklogs.');
      return;
    }

    // Show worklog details for confirmation
    console.log('🔄 About to delete the following worklog:');
    console.log('─'.repeat(80));
    console.log(`Issue: ${storedWorklog.issueKey} - ${storedWorklog.issueSummary}`);
    console.log(`Time: ${secondsToJiraFormat(storedWorklog.timeSpentSeconds)} (${storedWorklog.timeSpent})`);
    if (storedWorklog.comment) {
      console.log(`Comment: ${storedWorklog.comment}`);
    }
    const date = new Date(storedWorklog.started).toLocaleString();
    console.log(`Date: ${date}`);
    console.log('─'.repeat(80));

    // In a CLI environment, we'll proceed directly
    // In a real implementation, you might want to add a confirmation prompt
    console.log('⏳ Deleting worklog from JIRA...');

    try {
      // Delete from JIRA
      await client.deleteWorklog(storedWorklog.issueKey, storedWorklog.id);
      
      // Remove from local storage
      removeStoredWorklog(storedWorklog.id);
      
      console.log('✅ Worklog successfully deleted!');
      console.log(`🗑️  Removed ${secondsToJiraFormat(storedWorklog.timeSpentSeconds)} from ${storedWorklog.issueKey}`);
      
    } catch (error) {
      console.error('❌ Failed to delete worklog from JIRA:', error instanceof Error ? error.message : error);
      console.log('💡 The worklog may have already been deleted or you may not have permission.');
      
      // Ask if they want to remove from local storage anyway
      console.log('');
      console.log('❓ Remove from local storage anyway? This will prevent further undo attempts.');
      console.log('💡 You can manually verify in JIRA and then run this command again.');
      
      // For now, we'll leave it in local storage so user can try again
      return;
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Main undo function - handles both cases
 */
export async function handleUndo(worklogId?: string) {
  if (worklogId) {
    await undoWorklogById(worklogId);
  } else {
    await showUndoSelection();
  }
}

// Default export for CLI usage
export default handleUndo;