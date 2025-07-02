import { type JiraClient, createClient } from '../api/jira-client.js';
import { createTempoClient } from '../api/tempo-client.js';
import { secondsToJiraFormat } from '../utils/time-parser.js';
import {
  getStoredWorklogById,
  removeStoredWorklog,
} from '../utils/worklog-storage.js';
import { parallelMapLimit } from '../utils/concurrency.js';
import type { TempoWorklog, TempoWorklogsResponse } from '../types/tempo.js';

interface JiraRichTextContent {
  content?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    type?: string;
  }>;
  type?: string;
  version?: number;
}



/**
 * Show interactive selection of recent worklogs to undo (Tempo-first)
 */
export async function showUndoSelection() {
  try {
    const client = createClient();
    const tempoClient = createTempoClient();
    const user = await client.getCurrentUser();
    const todayISO = new Date().toISOString().slice(0, 10);
    const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, todayISO, todayISO);
    const tempoWorklogs = (tempoWorklogsResponse && typeof tempoWorklogsResponse === 'object' && Array.isArray((tempoWorklogsResponse as TempoWorklogsResponse).results))
      ? (tempoWorklogsResponse as TempoWorklogsResponse).results
      : Array.isArray(tempoWorklogsResponse) ? tempoWorklogsResponse as TempoWorklog[] : [];

    // Optionally, you could also fetch Jira worklogs if you want to support undo for both sources
    // For now, we focus on Tempo worklogs

    if (!tempoWorklogs.length) {
      console.log('📭 No worklogs found for today.');
      console.log('💡 You can undo any worklog by its ID: bookr undo <WORKLOG_ID>');
      return;
    }

    // Enrich with Jira issue info
    const uniqueIssueIds = Array.from(new Set(tempoWorklogs.map((w: TempoWorklog) => w.issue?.id).filter(Boolean)));
    const issueMap = new Map();
    await parallelMapLimit(uniqueIssueIds, 5, async (id) => {
      try {
        const issue = await client.getIssue(String(id));
        issueMap.set(id, { key: issue.key, summary: issue.fields.summary });
      } catch {
        // If not found, skip
      }
    });

    // Table header
    console.log('─'.repeat(120));
    console.log(
      `${'ID'.padEnd(17)} | ${'Issue'.padEnd(12)} | ${'Time'.padEnd(8)} | ${'Summary'.padEnd(50)} | Source`
    );
    console.log('─'.repeat(120));
    for (const worklog of tempoWorklogs) {
      const timeSpentSeconds = typeof worklog.timeSpentSeconds === 'number' ? worklog.timeSpentSeconds : 0;
      const timeDisplay = secondsToJiraFormat(timeSpentSeconds);
      const issueId = worklog.issue?.id || '';
      const issueInfo = issueMap.get(issueId) || {};
      const issueKey = issueInfo.key || '';
      const summary = (issueInfo.summary || worklog.description || '').slice(0, 50);
      const worklogId = String(worklog.tempoWorklogId || worklog.id || '');
      const source = worklog.tempoWorklogId ? 'tempo' : 'jira';
      console.log(
        `${worklogId.padEnd(17)} | ${issueKey.padEnd(12)} | ${timeDisplay.padEnd(8)} | ${summary.padEnd(50)} | ${source}`
      );
    }
    console.log('─'.repeat(120));
    console.log('');
    console.log('💡 To undo a specific worklog, run: bookr undo <WORKLOG_ID>');
    console.log('💡 You can undo ANY worklog that you have permission to delete');
    console.log('⚠️  Warning: This will permanently delete the worklog from Tempo!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Find worklog details by searching recent worklogs
 */
async function findWorklogDetails(client: JiraClient, worklogId: string) {
  try {
    // First check local storage for quick lookup
    const storedWorklog = getStoredWorklogById(worklogId);
    if (storedWorklog) {
      return {
        issueKey: storedWorklog.issueKey,
        worklog: {
          id: storedWorklog.id,
          timeSpentSeconds: storedWorklog.timeSpentSeconds,
          timeSpent: storedWorklog.timeSpent,
          comment: storedWorklog.comment,
          started: storedWorklog.started,
        },
        issue: {
          key: storedWorklog.issueKey,
          fields: { summary: storedWorklog.issueSummary },
        },
      };
    }

    // Search in today's worklogs
    const todayWorklogs = await client.getTodayWorklogs();
    for (const { issue, worklog } of todayWorklogs) {
      if (worklog.id === worklogId) {
        return { issueKey: issue.key, worklog, issue };
      }
    }

    // If not found in today's worklogs, search in recent worklogs (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const recentWorklogs = await client.searchWorklogsByDateRange(startDate, endDate);
    for (const { issue, worklog } of recentWorklogs) {
      if (worklog.id === worklogId) {
        return { issueKey: issue.key, worklog, issue };
      }
    }

    return null;
  } catch {
    return null;
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

    console.log(`🔄 Looking for worklog ${worklogId}...`);

    // Try to find worklog details
    const worklogDetails = await findWorklogDetails(client, worklogId);

    if (worklogDetails) {
      // Show worklog details for confirmation
      console.log('🔄 About to delete the following worklog:');
      console.log('─'.repeat(80));
      console.log(`Issue: ${worklogDetails.issue.key} - ${worklogDetails.issue.fields.summary}`);
      console.log(`Time: ${secondsToJiraFormat(worklogDetails.worklog.timeSpentSeconds || 0)}`);

      // Extract comment text properly
      let comment = '';
      if (typeof worklogDetails.worklog.comment === 'string') {
        comment = worklogDetails.worklog.comment;
      } else if (
        worklogDetails.worklog.comment &&
        typeof worklogDetails.worklog.comment === 'object'
      ) {
        // Handle JIRA's rich text format
        try {
          const content = worklogDetails.worklog.comment as JiraRichTextContent;
          if (content.content && Array.isArray(content.content)) {
            comment = content.content
              .map((paragraph) => paragraph.content?.map((text) => text.text || '').join(''))
              .join('\n');
          }
        } catch {
          comment = 'Rich text comment';
        }
      }

      if (comment) {
        console.log(`Comment: ${comment}`);
      }

      const date = new Date(worklogDetails.worklog.started || '').toLocaleString();
      console.log(`Date: ${date}`);
      console.log('─'.repeat(80));

      console.log('⏳ Deleting worklog from JIRA...');

      try {
        // Delete from JIRA
        await client.deleteWorklog(worklogDetails.issueKey, worklogId);

        // Remove from local storage if it exists there
        removeStoredWorklog(worklogId);

        console.log('✅ Worklog successfully deleted!');
        console.log(
          `🗑️  Removed ${secondsToJiraFormat(worklogDetails.worklog.timeSpentSeconds || 0)} from ${worklogDetails.issueKey}`
        );
      } catch (error) {
        console.error(
          '❌ Failed to delete worklog from JIRA:',
          error instanceof Error ? error.message : error
        );
        console.log('💡 The worklog may have already been deleted or you may not have permission.');
        return;
      }
    } else {
      // Worklog not found in recent searches, but we can still try to delete it
      // if the user provides the issue key
      console.log(`⚠️  Could not find details for worklog ${worklogId} in recent worklogs.`);
      console.log('💡 The worklog might be older than 7 days or from a different user.');
      console.log('💡 To delete it anyway, you need to know the issue key.');
      console.log('💡 Usage: You can try finding it manually in JIRA first.');
      console.log('');
      console.log('💡 Alternative: If you know the issue key, you can delete directly in JIRA:');
      console.log(`   Browse to the issue → Worklogs → Delete worklog ${worklogId}`);
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
