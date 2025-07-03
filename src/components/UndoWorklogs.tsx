import { Box, Text } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createClient } from '../api/jira-client.js';
import { createTempoClient } from '../api/tempo-client.js';
import { parallelMapLimit } from '../utils/concurrency.js';
import type { TempoWorklog, TempoWorklogsResponse } from '../types/tempo.js';
import { WorklogTable } from './WorklogTable.js';

type UndoWorklogsState = 'loading' | 'error' | 'success' | 'no-worklogs';

interface WorklogEntry {
  tempoId?: string;
  jiraId?: string;
  issueKey: string;
  timeSpentSeconds: number;
  summary: string;
  source: 'tempo' | 'jira';
}

export const UndoWorklogs: React.FC = () => {
  const [state, setState] = useState<UndoWorklogsState>('loading');
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUndoWorklogs() {
      try {
        const client = createClient();
        const tempoClient = createTempoClient();
        const user = await client.getCurrentUser();
        const todayISO = new Date().toISOString().slice(0, 10);
        
        const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, todayISO, todayISO);
        const tempoWorklogs = (tempoWorklogsResponse && typeof tempoWorklogsResponse === 'object' && Array.isArray((tempoWorklogsResponse as TempoWorklogsResponse).results))
          ? (tempoWorklogsResponse as TempoWorklogsResponse).results
          : Array.isArray(tempoWorklogsResponse) ? tempoWorklogsResponse as TempoWorklog[] : [];

        if (!tempoWorklogs.length) {
          setState('no-worklogs');
          return;
        }

        // Collect unique issue IDs
        const uniqueIssueIds = Array.from(new Set(tempoWorklogs.map((w: TempoWorklog) => w.issue?.id).filter(Boolean)));
        
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

        // Transform worklogs to our format
        const formattedWorklogs: WorklogEntry[] = tempoWorklogs.map((worklog) => {
          const timeSpentSeconds = typeof worklog.timeSpentSeconds === 'number' ? worklog.timeSpentSeconds : 0;
          const issueId = worklog.issue?.id || '';
          const issueInfo = issueMap.get(issueId) || {};
          const issueKey = issueInfo.key || '';
          const summary = (issueInfo.summary || worklog.description || '').slice(0, 50);
          const tempoId = worklog.tempoWorklogId ? String(worklog.tempoWorklogId) : '';
          const jiraId = worklog.tempoWorklogId ? String(worklog.tempoWorklogId) : String(worklog.id || '');
          const source = worklog.tempoWorklogId ? 'tempo' : 'jira';

          return {
            tempoId,
            jiraId,
            issueKey,
            timeSpentSeconds,
            summary,
            source,
          };
        });

        setWorklogs(formattedWorklogs);
        setState('success');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
        setState('error');
      }
    }

    fetchUndoWorklogs();
  }, []);

  if (state === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>⏳ Loading worklogs for undo...</Text>
      </Box>
    );
  }

  if (state === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  if (state === 'no-worklogs') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">📭 No worklogs found for today.</Text>
        <Box marginTop={1}>
          <Text color="gray">💡 You can undo any worklog by its ID: bookr undo &lt;WORKLOG_ID&gt;</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <WorklogTable 
        worklogs={worklogs} 
        title="🗑️ Worklogs Available for Undo" 
        showTempoId={true} 
        showJiraId={true} 
        showSource={true}
      />
      <Box marginTop={2} flexDirection="column">
        <Text color="cyan">💡 To undo a specific worklog, run: bookr undo &lt;WORKLOG_ID&gt;</Text>
        <Text color="cyan">💡 You can undo ANY worklog that you have permission to delete</Text>
        <Text color="red" bold>⚠️  Warning: This will permanently delete the worklog from Tempo!</Text>
      </Box>
    </Box>
  );
}; 