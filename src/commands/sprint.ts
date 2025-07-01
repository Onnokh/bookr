import inquirer from 'inquirer';
import { type JiraClient, createClient } from '../api/jira-client.js';
import type { JiraIssue, JiraWorklog } from '../types/jira.js';
import { formatDateRange } from '../utils/date.js';
import { extractCommentText } from '../utils/jira.js';
import { secondsToJiraFormat } from '../utils/time-parser.js';

function parseArgs(): { history: boolean } {
  return {
    history: process.argv.includes('--history'),
  };
}

async function selectSprint(client: JiraClient): Promise<{
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
} | null> {
  const boards = await client.getBoards();
  if (!boards.length) {
    console.log('❌ No boards found.');
    return null;
  }

  // If there's only one board, use it directly
  let boardId: number;
  if (boards.length === 1) {
    const board = boards[0];
    if (!board) {
      console.log('❌ No boards found.');
      return null;
    }
    boardId = board.id;
    console.log(`📋 Using board: ${board.name}`);
  } else {
    // Let user select a board
    const boardChoices = boards.map((board: { id: number; name: string }) => ({
      name: board.name,
      value: board.id,
      short: board.name,
    }));

    const { selectedBoardId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedBoardId',
        message: 'Select a board:',
        choices: boardChoices,
        pageSize: 10,
      },
    ]);
    boardId = selectedBoardId;
  }

  const sprints = await client.getSprintsForBoard(boardId);
  if (!sprints.length) {
    console.log('❌ No sprints found for the selected board.');
    return null;
  }

  console.log(`📊 Found ${sprints.length} sprints for this board.`);

  const choices = sprints.map(
    (sprint: {
      id: number;
      name: string;
      state: string;
      startDate?: string;
      endDate?: string;
    }) => ({
      name: `${sprint.name} [${sprint.state}]${sprint.startDate && sprint.endDate ? ` (${formatDateRange(new Date(sprint.startDate), new Date(sprint.endDate))})` : ''}`,
      value: sprint.id,
      short: sprint.name,
    })
  );
  const { sprintId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sprintId',
      message: 'Select a sprint:',
      choices,
      pageSize: 15,
    },
  ]);
  return sprints.find((s: { id: number }) => s.id === sprintId) || null;
}

export async function showSprintWorklogs() {
  try {
    const client = createClient();

    // Test connection
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.log('❌ Failed to connect to JIRA');
      return;
    }

    const { history } = parseArgs();
    let sprint: {
      id: number;
      name: string;
      startDate?: string;
      endDate?: string;
    } | null;
    if (history) {
      sprint = await selectSprint(client);
      if (!sprint) return;
      if (!sprint.startDate || !sprint.endDate) {
        console.log('❌ Selected sprint does not have valid start or end dates.');
        return;
      }
    } else {
      sprint = await client.getCurrentSprint();
      if (!sprint.startDate || !sprint.endDate) {
        console.log('❌ Current sprint does not have valid start or end dates.');
        return;
      }
    }
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const dateRange = formatDateRange(startDate, endDate);

    console.log(`🔄 Fetching worklogs for sprint: ${sprint.name}`);
    console.log(
      `📅 Searching for worklogs between: ${startDate.toISOString()} and ${endDate.toISOString()}`
    );
    console.log(
      `📅 Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
    );

    try {
      // Use the new method that searches for worklogs within the exact date range
      console.log('🔍 Starting worklog search...');
      const worklogsWithIssues = await client.searchWorklogsByDateRange(startDate, endDate);
      console.log(`📊 Found ${worklogsWithIssues.length} worklog entries for this sprint period.`);

      // Display sprint header
      console.log('─'.repeat(80));
      console.log(`🏃‍♂️  SPRINT WORKLOGS: ${sprint.name} (${dateRange})`);
      console.log('─'.repeat(80));

      if (worklogsWithIssues.length === 0) {
        console.log('📭 No worklogs found for this sprint period.');
        console.log(`📊 Sprint period: ${dateRange}`);
        console.log(`📊 Current date: ${new Date().toLocaleDateString()}`);
        return;
      }

      // Calculate total time
      let totalSeconds = 0;

      // Group worklogs by date
      const worklogsByDate: Record<string, Array<{ issue: JiraIssue; worklog: JiraWorklog }>> = {};

      for (const { issue, worklog } of worklogsWithIssues) {
        const timeSpent = worklog.timeSpentSeconds || 0;
        totalSeconds += timeSpent;

        if (!worklog.started) continue; // Skip worklogs without start date

        const worklogDate = new Date(worklog.started);
        const dateKey = worklogDate.toLocaleDateString();

        if (!worklogsByDate[dateKey]) {
          worklogsByDate[dateKey] = [];
        }
        worklogsByDate[dateKey].push({ issue, worklog });
      }

      // Display worklogs grouped by date
      for (const [date, dayWorklogs] of Object.entries(worklogsByDate)) {
        console.log(`\n📅 ${date}:`);
        console.log('─'.repeat(40));

        let dayTotal = 0;

        for (const { issue, worklog } of dayWorklogs) {
          const timeSpent = worklog.timeSpentSeconds || 0;
          dayTotal += timeSpent;
          const timeDisplay = secondsToJiraFormat(timeSpent);
          const comment = extractCommentText(worklog.comment);

          console.log(`${issue.key.padEnd(12)} | ${issue.fields.summary}`);
          if (comment && comment !== 'No comment') {
            console.log(`${timeDisplay.padEnd(12)} - ${comment}`);
          }
          console.log('');
        }

        const dayTotalDisplay = secondsToJiraFormat(dayTotal);
        console.log(`📊 Day Total: ${dayTotalDisplay}`);
      }

      // Display summary
      console.log('─'.repeat(80));
      const totalTime = secondsToJiraFormat(totalSeconds);
      const totalHours = (totalSeconds / 3600).toFixed(2);

      console.log('📊 Sprint Summary:');
      console.log(`   Period: ${dateRange}`);
      console.log(`   Total Time: ${totalTime} (${totalHours} hours)`);
      console.log(`   Worklog Entries: ${worklogsWithIssues.length}`);

      // Calculate average time per day
      const sprintDays =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const avgTimePerDay = totalSeconds / sprintDays;
      const avgTimePerDayDisplay = secondsToJiraFormat(avgTimePerDay);
      console.log(`   Average Time per Day: ${avgTimePerDayDisplay}`);

      // Show unique issues worked on
      const uniqueIssues = new Set(worklogsWithIssues.map((w) => w.issue.key)).size;
      console.log(`   Issues Worked On: ${uniqueIssues}`);
    } catch (error) {
      throw new Error(
        `Error fetching sprint worklogs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Default export for CLI usage
export default showSprintWorklogs;

// For backward compatibility when running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  showSprintWorklogs().catch(console.error);
}
