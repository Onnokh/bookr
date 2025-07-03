import { Box, Text } from 'ink';
import type React from 'react';
import { secondsToJiraFormat } from '../utils/time-parser.js';

interface WorklogEntry {
  tempoId?: string;
  jiraId?: string;
  issueKey: string;
  timeSpentSeconds: number;
  summary: string;
  source?: 'tempo' | 'jira';
}

interface WorklogTableProps {
  worklogs: WorklogEntry[];
  title?: string;
  showTempoId?: boolean;
  showJiraId?: boolean;
  showSource?: boolean;
}

export const WorklogTable: React.FC<WorklogTableProps> = ({
  worklogs,
  title = 'Worklogs',
  showTempoId = true,
  showJiraId = true,
  showSource = false,
}) => {
  if (!worklogs.length) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">📭 No worklogs found.</Text>
      </Box>
    );
  }

  // Calculate totals
  const totalSeconds = worklogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);
  const totalTime = secondsToJiraFormat(totalSeconds);
  const totalHours = (totalSeconds / 3600).toFixed(2);
  const uniqueIssues = new Set(worklogs.map(w => w.issueKey));

  // Determine column widths based on content
  const maxTempoIdLength = Math.max(8, ...worklogs.map(w => (w.tempoId || '').length));
  const maxJiraIdLength = Math.max(8, ...worklogs.map(w => (w.jiraId || '').length));
  const maxIssueKeyLength = Math.max(6, ...worklogs.map(w => w.issueKey.length));
  const maxTimeLength = 6; // Fixed width for time column
  const maxSummaryLength = Math.max(8, ...worklogs.map(w => w.summary.length));
  const maxSourceLength = showSource ? 6 : 0; // "tempo" or "jira"

  // Create separator line
  const separatorLength = (showTempoId ? maxTempoIdLength + 3 : 0) + 
                         (showJiraId ? maxJiraIdLength + 3 : 0) + 
                         maxIssueKeyLength + 3 + 
                         maxTimeLength + 3 + 
                         maxSummaryLength +
                         (showSource ? maxSourceLength + 3 : 0);
  const separator = '─'.repeat(separatorLength);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Title */}
      <Text color="cyan" bold>
        {title}
      </Text>

      {/* Separator */}
      <Text color="gray">{separator}</Text>

      {/* Header */}
      <Box>
        {showTempoId && (
          <Text color="yellow" bold>
            {('Tempo ID'.padEnd(maxTempoIdLength))} |{' '}
          </Text>
        )}
        {showJiraId && (
          <Text color="yellow" bold>
            {('Jira ID'.padEnd(maxJiraIdLength))} |{' '}
          </Text>
        )}
        <Text color="yellow" bold>
          {('Issue'.padEnd(maxIssueKeyLength))} |{' '}
        </Text>
        <Text color="yellow" bold>
          {('Time'.padEnd(maxTimeLength))} |{' '}
        </Text>
        <Text color="yellow" bold>
          Summary
        </Text>
        {showSource && (
          <Text color="yellow" bold>
            {' | Source'}
          </Text>
        )}
      </Box>

      {/* Separator */}
      <Text color="gray">{separator}</Text>

      {/* Worklog rows */}
      {worklogs.map((worklog, index) => (
        <Box key={`${worklog.tempoId || worklog.jiraId || index}`}>
          {showTempoId && (
            <Text>
              {(worklog.tempoId || '').padEnd(maxTempoIdLength)} |{' '}
            </Text>
          )}
          {showJiraId && (
            <Text>
              {(worklog.jiraId || '').padEnd(maxJiraIdLength)} |{' '}
            </Text>
          )}
          <Text>
            {worklog.issueKey.padEnd(maxIssueKeyLength)} |{' '}
          </Text>
          <Text>
            {secondsToJiraFormat(worklog.timeSpentSeconds).padEnd(maxTimeLength)} |{' '}
          </Text>
          <Text>
            {worklog.summary}
          </Text>
          {showSource && (
            <Text>
              {' | '}{(worklog.source || '').padEnd(maxSourceLength)}
            </Text>
          )}
        </Box>
      ))}

      {/* Separator */}
      <Text color="gray">{separator}</Text>

      {/* Summary */}
      <Box marginTop={1} flexDirection="column">
        <Text color="green" bold>
          📊 Total time: {totalTime} ({totalHours} hours)
        </Text>
        <Text color="blue">
          📝 Worklog entries: {worklogs.length}
        </Text>
        <Text color="magenta">
          🎯 Issues worked on: {uniqueIssues.size}
        </Text>
      </Box>
    </Box>
  );
}; 