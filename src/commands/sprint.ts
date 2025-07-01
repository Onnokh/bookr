import inquirer from 'inquirer';
import { type JiraClient, createClient } from '../api/jira-client.js';
import { createTempoClient } from '../api/tempo-client.js';
import { formatDateRange } from '../utils/date.js';
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

// Helper to limit concurrency for parallel fetches
async function parallelMapLimit<T, R>(arr: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const ret: R[] = [];
  let i = 0;
  async function next() {
    if (i >= arr.length) return;
    const idx = i++;
    const item = arr[idx];
    ret[idx] = item !== undefined ? await fn(item) : undefined as any;
    await next();
  }
  await Promise.all(Array(Math.min(limit, arr.length)).fill(0).map(next));
  return ret;
}

export async function showSprintWorklogs() {
  try {
    const client = createClient();
    const tempoClient = createTempoClient();
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
    const fromISO = startDate.toISOString().slice(0, 10);
    const toISO = endDate.toISOString().slice(0, 10);
    const user = await client.getCurrentUser();
    console.log(`${sprint.name}`);
    console.log(`${fromISO} to ${toISO}`);
    const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, fromISO, toISO);
    const tempoWorklogs = (tempoWorklogsResponse && typeof tempoWorklogsResponse === 'object' && Array.isArray((tempoWorklogsResponse as any).results))
      ? (tempoWorklogsResponse as any).results
      : Array.isArray(tempoWorklogsResponse) ? tempoWorklogsResponse : [];
    if (!tempoWorklogs.length) {
      console.log('📭 No worklogs found for this sprint period.');
      return;
    }
    // Collect unique issue IDs
    const uniqueIssueIds = Array.from(new Set((tempoWorklogs as any[]).map((w: any) => w.issue?.id).filter(Boolean)));
    // Fetch all issues in parallel (limit concurrency to 5)
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
    console.log(`${'ID'.padEnd(17)} | ${'Issue'.padEnd(12)} | ${'Time'.padEnd(8)} | Summary`);
    console.log('─'.repeat(120));
    let totalSeconds = 0;
    const uniqueIssues = new Set<string>();
    for (const worklog of tempoWorklogs as any[]) {
      const timeSpentSeconds = worklog.timeSpentSeconds || worklog.timeSpent || 0;
      totalSeconds += timeSpentSeconds;
      const timeDisplay = secondsToJiraFormat(timeSpentSeconds);
      const issueId = worklog.issue?.id || '';
      const issueInfo = issueMap.get(issueId) || {};
      const issueKey = issueInfo.key || '';
      uniqueIssues.add(String(issueKey));
      const summary = issueInfo.summary || worklog.description || '';
      const worklogId = worklog.tempoWorklogId ? String(worklog.tempoWorklogId) : String(worklog.id || '');
      console.log(`${worklogId.padEnd(17)} | ${issueKey.padEnd(12)} | ${timeDisplay.padEnd(8)} | ${summary}`);
    }
    console.log('─'.repeat(120));
    const totalTime = secondsToJiraFormat(totalSeconds);
    const totalHours = (totalSeconds / 3600).toFixed(2);
    console.log(`📊 Sprint Total: ${totalTime} (${totalHours} hours)`);
    console.log(`📝 Worklog entries: ${tempoWorklogs.length}`);
    console.log(`🎯 Issues worked on: ${uniqueIssues.size}`);
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
