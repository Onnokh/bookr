import { Box, Text } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createClient } from '../api/jira-client.js';
import { createTempoClient } from '../api/tempo-client.js';
import { parallelMapLimit } from '../utils/concurrency.js';
import type { TempoWorklog, TempoWorklogsResponse } from '../types/tempo.js';
import { WorklogTable } from './WorklogTable.js';

type SprintWorklogsState = 'loading' | 'error' | 'success' | 'no-worklogs' | 'no-sprint';

interface WorklogEntry {
  tempoId?: string;
  jiraId?: string;
  issueKey: string;
  timeSpentSeconds: number;
  summary: string;
}

export const SprintWorklogs: React.FC = () => {
  const [state, setState] = useState<SprintWorklogsState>('loading');
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sprintInfo, setSprintInfo] = useState<{
    name: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  useEffect(() => {
    async function fetchSprintWorklogs() {
      try {
        const client = createClient();
        const tempoClient = createTempoClient();
        
        // Get current sprint
        const sprint = await client.getCurrentSprint();
        if (!sprint.startDate || !sprint.endDate) {
          setState('no-sprint');
          return;
        }

        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const fromISO = startDate.toISOString().slice(0, 10);
        const toISO = endDate.toISOString().slice(0, 10);
        
        setSprintInfo({
          name: sprint.name,
          startDate: fromISO,
          endDate: toISO,
        });

        const user = await client.getCurrentUser();
        const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, fromISO, toISO);
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
          const timeSpentSeconds = worklog.timeSpentSeconds || 0;
          const issueId = worklog.issue?.id || '';
          const issueInfo = issueMap.get(issueId) || {};
          const issueKey = issueInfo.key || '';
          const summary = issueInfo.summary || worklog.description || '';
          const tempoId = worklog.tempoWorklogId ? String(worklog.tempoWorklogId) : '';
          const jiraId = worklog.tempoWorklogId ? String(worklog.tempoWorklogId) : String(worklog.id || '');

          return {
            tempoId,
            jiraId,
            issueKey,
            timeSpentSeconds,
            summary,
          };
        });

        setWorklogs(formattedWorklogs);
        setState('success');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
        setState('error');
      }
    }

    fetchSprintWorklogs();
  }, []);

  if (state === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>⏳ Loading sprint worklogs...</Text>
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

  if (state === 'no-sprint') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">❌ Current sprint does not have valid start or end dates.</Text>
      </Box>
    );
  }

  if (state === 'no-worklogs') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">📭 No worklogs found for this sprint period.</Text>
      </Box>
    );
  }

  if (!sprintInfo) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ No sprint information available.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>
        🏃 Sprint: {sprintInfo.name}
      </Text>
      <Text color="gray">
        📅 {sprintInfo.startDate} to {sprintInfo.endDate}
      </Text>
      <Box marginTop={1}>
        <WorklogTable 
          worklogs={worklogs} 
          title="📊 Sprint Worklogs" 
          showTempoId={false} 
          showJiraId={true} 
        />
      </Box>
    </Box>
  );
}; 