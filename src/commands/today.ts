import { createClient } from '../api/jira-client.js';
import { secondsToJiraFormat } from '../utils/time-parser.js';
import { createTempoClient } from '../api/tempo-client.js';

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

export async function showTodayWorklogs() {
  try {
    const client = createClient();
    const tempoClient = createTempoClient();
    const user = await client.getCurrentUser();
    const todayISO = new Date().toISOString().slice(0, 10);
    const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, todayISO, todayISO);
    const tempoWorklogs = (tempoWorklogsResponse && typeof tempoWorklogsResponse === 'object' && Array.isArray((tempoWorklogsResponse as any).results))
      ? (tempoWorklogsResponse as any).results
      : Array.isArray(tempoWorklogsResponse) ? tempoWorklogsResponse : [];

    if (!tempoWorklogs.length) {
      console.log('📭 No worklogs found for today.');
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
    console.log('─'.repeat(140));
    console.log(`${'Tempo ID'.padEnd(12)} | ${'Jira ID'.padEnd(12)} | ${'Issue'.padEnd(16)} | ${'Time'.padEnd(6)} | Summary`);
    console.log('─'.repeat(140));
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
      const tempoId = worklog.tempoWorklogId ? String(worklog.tempoWorklogId) : '';
      const jiraId = worklog.id ? String(worklog.id) : '';
      console.log(`${tempoId.padEnd(12)} | ${jiraId.padEnd(12)} | ${issueKey.padEnd(16)} | ${timeDisplay.padEnd(6)} | ${summary}`);
    }
    console.log('─'.repeat(140));
    const totalTime = secondsToJiraFormat(totalSeconds);
    const totalHours = (totalSeconds / 3600).toFixed(2);
    console.log(`📊 Total time today: ${totalTime} (${totalHours} hours)`);
    console.log(`📝 Worklog entries: ${tempoWorklogs.length}`);
    console.log(`🎯 Issues worked on: ${uniqueIssues.size}`);
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
