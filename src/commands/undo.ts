import { type JiraClient, createClient } from '../api/jira-client.js';
import { createTempoClient } from '../api/tempo-client.js';
import { secondsToJiraFormat } from '../utils/time-parser.js';
import {
  removeStoredWorklog,
  getLastWorklog,
  getStoredWorklogById,
} from '../utils/worklog-storage.js';
import { parallelMapLimit } from '../utils/concurrency.js';
import type { TempoWorklog, TempoWorklogsResponse } from '../types/tempo.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

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

    // Prepare worklog choices for interactive selection
    const worklogChoices = tempoWorklogs.map((worklog) => {
      const timeSpentSeconds = typeof worklog.timeSpentSeconds === 'number' ? worklog.timeSpentSeconds : 0;
      const timeDisplay = secondsToJiraFormat(timeSpentSeconds);
      const issueId = worklog.issue?.id || '';
      const issueInfo = issueMap.get(issueId) || {};
      const issueKey = issueInfo.key || '';
      const summary = (issueInfo.summary || worklog.description || '').slice(0, 50);
      const worklogId = String(worklog.tempoWorklogId || worklog.id || '');
      const source = worklog.tempoWorklogId ? 'tempo' : 'jira';
      
      return {
        name: `${worklogId.padEnd(17)} | ${issueKey.padEnd(12)} | ${timeDisplay.padEnd(8)} | ${summary.padEnd(50)} | ${source}`,
        value: worklogId,
        short: worklogId,
      };
    });

    // Add a cancel option
    worklogChoices.push({
      name: '❌ Cancel',
      value: 'cancel',
      short: 'Cancel',
    });

    // Show interactive selection
    const { selectedWorklog } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedWorklog',
        message: '🗑️ Select a worklog to delete:',
        choices: worklogChoices,
        pageSize: 10,
      },
    ]);

    if (selectedWorklog === 'cancel') {
      console.log('❌ Cancelled.');
      return;
    }

    // Proceed with deletion
    await undoWorklogById(selectedWorklog);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Find worklog details by searching Tempo worklogs
 */
async function findWorklogDetails(client: JiraClient, worklogId: string) {
  try {
    const tempoClient = createTempoClient();
    const user = await client.getCurrentUser();
    
    // Search today's Tempo worklogs
    const todayISO = new Date().toISOString().slice(0, 10);
    const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, todayISO, todayISO);
    const tempoWorklogs = (tempoWorklogsResponse && typeof tempoWorklogsResponse === 'object' && Array.isArray((tempoWorklogsResponse as TempoWorklogsResponse).results))
      ? (tempoWorklogsResponse as TempoWorklogsResponse).results
      : Array.isArray(tempoWorklogsResponse) ? tempoWorklogsResponse as TempoWorklog[] : [];

    for (const tempoWorklog of tempoWorklogs) {
      const tempoWorklogId = String(tempoWorklog.tempoWorklogId || tempoWorklog.id || '');
      if (tempoWorklogId === worklogId) {
        // Get issue details
        const issueId = tempoWorklog.issue?.id;
        if (issueId) {
          try {
            const issue = await client.getIssue(String(issueId));
            return {
              issueKey: issue.key,
              worklog: {
                id: worklogId,
                timeSpentSeconds: tempoWorklog.timeSpentSeconds || 0,
                timeSpent: tempoWorklog.timeSpent || '',
                comment: tempoWorklog.description || '',
                started: tempoWorklog.started || new Date().toISOString(),
              },
              issue: {
                key: issue.key,
                fields: { summary: issue.fields.summary },
              },
              isTempoWorklog: true,
            };
          } catch {
            // If we can't get issue details, still return the worklog info
            return {
              issueKey: tempoWorklog.issue?.key || 'UNKNOWN',
              worklog: {
                id: worklogId,
                timeSpentSeconds: tempoWorklog.timeSpentSeconds || 0,
                timeSpent: tempoWorklog.timeSpent || '',
                comment: tempoWorklog.description || '',
                started: tempoWorklog.started || new Date().toISOString(),
              },
              issue: {
                key: tempoWorklog.issue?.key || 'UNKNOWN',
                fields: { summary: 'Unknown issue' },
              },
              isTempoWorklog: true,
            };
          }
        }
      }
    }

    // If not found in today's Tempo worklogs, search recent Tempo worklogs (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const fromISO = startDate.toISOString().slice(0, 10);
    const toISO = endDate.toISOString().slice(0, 10);
    
    const recentTempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, fromISO, toISO);
    const recentTempoWorklogs = (recentTempoWorklogsResponse && typeof recentTempoWorklogsResponse === 'object' && Array.isArray((recentTempoWorklogsResponse as TempoWorklogsResponse).results))
      ? (recentTempoWorklogsResponse as TempoWorklogsResponse).results
      : Array.isArray(recentTempoWorklogsResponse) ? recentTempoWorklogsResponse as TempoWorklog[] : [];

    for (const tempoWorklog of recentTempoWorklogs) {
      const tempoWorklogId = String(tempoWorklog.tempoWorklogId || tempoWorklog.id || '');
      if (tempoWorklogId === worklogId) {
        // Get issue details
        const issueId = tempoWorklog.issue?.id;
        if (issueId) {
          try {
            const issue = await client.getIssue(String(issueId));
            return {
              issueKey: issue.key,
              worklog: {
                id: worklogId,
                timeSpentSeconds: tempoWorklog.timeSpentSeconds || 0,
                timeSpent: tempoWorklog.timeSpent || '',
                comment: tempoWorklog.description || '',
                started: tempoWorklog.started || new Date().toISOString(),
              },
              issue: {
                key: issue.key,
                fields: { summary: issue.fields.summary },
              },
              isTempoWorklog: true,
            };
          } catch {
            // If we can't get issue details, still return the worklog info
            return {
              issueKey: tempoWorklog.issue?.key || 'UNKNOWN',
              worklog: {
                id: worklogId,
                timeSpentSeconds: tempoWorklog.timeSpentSeconds || 0,
                timeSpent: tempoWorklog.timeSpent || '',
                comment: tempoWorklog.description || '',
                started: tempoWorklog.started || new Date().toISOString(),
              },
              issue: {
                key: tempoWorklog.issue?.key || 'UNKNOWN',
                fields: { summary: 'Unknown issue' },
              },
              isTempoWorklog: true,
            };
          }
        }
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
      // Show styled, multi-line summary for confirmation
      const { issue, worklog } = worklogDetails;
      const time = secondsToJiraFormat(worklog.timeSpentSeconds || 0);
      const comment = typeof worklog.comment === 'string' ? worklog.comment : '';
      const date = new Date(worklog.started || '').toLocaleString();
      let project: string | undefined;
      let status: string | undefined;
      if (issue.fields && typeof issue.fields === 'object') {
        const f = issue.fields as Record<string, unknown>;
        const proj = f['project'];
        if (proj && typeof proj === 'object' && 'name' in proj && typeof (proj as Record<string, unknown>)['name'] === 'string') {
          project = (proj as { name: string }).name;
        }
        const stat = f['status'];
        if (stat && typeof stat === 'object' && 'name' in stat && typeof (stat as Record<string, unknown>)['name'] === 'string') {
          status = (stat as { name: string }).name;
        }
      }

      console.log();
      console.log(chalk.bold.cyan('🗑️  Confirm Worklog Deletion'));
      console.log();
      console.log(`${chalk.bold('Issue:')} ${chalk.yellow(issue.key)}${issue.fields.summary ? ` – ${issue.fields.summary}` : ''}`);
      if (project) console.log(`${chalk.bold('Project:')} ${project}`);
      if (status) console.log(`${chalk.bold('Status:')} ${status}`);
      console.log(`${chalk.bold('Time:')} ${time}`);
      if (comment) console.log(`${chalk.bold('Comment:')} ${comment}`);
      console.log(`${chalk.bold('Date:')} ${date}`);
      console.log();

      // List-style confirmation prompt
      const { confirmDelete } = await inquirer.prompt([
        {
          type: 'list',
          name: 'confirmDelete',
          message: chalk.red('Are you sure you want to delete this worklog?'),
          choices: [
            {
              name: chalk.green('✅ Confirm and delete worklog'),
              value: true,
              short: 'Confirm',
            },
            {
              name: chalk.red('❌ Cancel'),
              value: false,
              short: 'Cancel',
            },
          ],
        },
      ]);
      if (!confirmDelete) {
        console.log('❌ Deletion cancelled.');
        return;
      }

      console.log('⏳ Deleting worklog from Tempo...');

      try {
        // Delete from Tempo
        const tempoClient = createTempoClient();
        await tempoClient.deleteWorklog(worklogId);

        // Remove from local storage if it exists there
        removeStoredWorklog(worklogId);

        console.log('✅ Worklog successfully deleted!');
        console.log(
          `🗑️  Removed ${secondsToJiraFormat(worklogDetails.worklog.timeSpentSeconds || 0)} from ${worklogDetails.issueKey}`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : error;
        console.error(
          '❌ Failed to delete worklog from Tempo:',
          errorMessage
        );
        
        // Check if the error indicates the worklog was already deleted
        if (typeof errorMessage === 'string' && (
          errorMessage.includes('404') || 
          errorMessage.includes('Not Found') ||
          errorMessage.includes('already deleted')
        )) {
          console.log('💡 The worklog appears to have already been deleted.');
          // Clean up the local cache anyway
          removeStoredWorklog(worklogId);
          console.log('🧹 Cleaned up local cache.');
        } else {
          console.log('💡 The worklog may not exist or you may not have permission to delete it.');
        }
        return;
      }
    } else {
      // Worklog not found in Tempo searches
      console.log(`⚠️  Could not find Tempo worklog ${worklogId} in recent worklogs.`);
      console.log('💡 The worklog might be:');
      console.log('   - Older than 7 days');
      console.log('   - From a different user');
      console.log('   - Already deleted');
      console.log('   - In a project you no longer have access to');
      
      // Check if this worklog exists in our local cache
      const storedWorklog = getStoredWorklogById(worklogId);
      if (storedWorklog) {
        console.log('💡 Found worklog in local cache - it may have been deleted from Tempo.');
        console.log('🧹 Cleaning up local cache...');
        removeStoredWorklog(worklogId);
        console.log('✅ Local cache cleaned up.');
      }
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
    // Try to undo the last worklog if no ID provided
    const lastWorklog = getLastWorklog();
    if (lastWorklog) {
      console.log(`🔄 No worklog ID provided. Attempting to undo the last worklog: ${lastWorklog.id}`);
      await undoWorklogById(lastWorklog.id);
    } else {
      console.log('📭 No recent worklog found to undo.');
      console.log('💡 You can undo any worklog by its ID: bookr undo <WORKLOG_ID>');
      console.log('💡 Or run "bookr undo" to see recent worklogs');
      await showUndoSelection();
    }
  }
}

// Default export for CLI usage
export default handleUndo;
