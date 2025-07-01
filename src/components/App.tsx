import { Box, Text } from 'ink';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createClient } from '../api/jira-client.js';
import type { JiraIssue } from '../types/jira.js';
import { getTicketFromBranch, getCurrentBranch, isGitRepository } from '../utils/git.js';
import {
  formatJiraDate,
  formatTimeForDisplay,
  isValidTimeFormat,
  parseTimeToSeconds,
  secondsToJiraFormat,
} from '../utils/time-parser.js';
import { ConfirmationPrompt } from './ConfirmationPrompt.js';

interface AppProps {
  input: string[];
  flags: {
    ticket?: string | undefined;
    time?: string | undefined;
    date?: string | undefined;
    description?: string | undefined;
  } & Record<string, unknown>;
}

type AppState =
  | 'loading'
  | 'error'
  | 'no-issue'
  | 'invalid-time'
  | 'confirm'
  | 'creating'
  | 'success'
  | 'cancelled';

export const App: React.FC<AppProps> = ({ input: _input, flags }) => {
  const [currentBranch, setCurrentBranch] = useState<string>('Loading...');
  const [jiraIssue, setJiraIssue] = useState<JiraIssue | null>(null);
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState<string>('');

  useEffect(() => {
    async function initialize() {
      try {
        // Check if we're in a Git repository (only required if no ticket provided)
        if (!flags.ticket && !isGitRepository()) {
          setError(
            'Not in a Git repository and no ticket provided. Please either run from a Git repository or specify a ticket: bookr PROJ-123 2h30m'
          );
          setAppState('error');
          return;
        }

        // Get current Git branch (only if we need it)
        if (!flags.ticket) {
          const branch = getCurrentBranch();
          setCurrentBranch(branch);
        } else {
          setCurrentBranch('N/A (ticket provided)');
        }

        // Check if time was provided
        if (!flags.time) {
          setError('No time specified. Please provide time (e.g., "2h30m", "1h15m", "45m")');
          setAppState('error');
          return;
        }

        // Validate time format
        if (!isValidTimeFormat(flags.time)) {
          setError(
            `Invalid time format: "${flags.time}". Use formats like "2h30m", "1h15m", "45m", "2.5h"`
          );
          setAppState('invalid-time');
          return;
        }

        setTimeSpent(flags.time);

        // Use provided ticket or extract from branch name
        let issueKey: string | null = null;

        if (flags.ticket) {
          // Use explicitly provided ticket
          issueKey = flags.ticket;
        } else {
          // Try to extract JIRA issue key from branch name
          const branch = getCurrentBranch();
          issueKey = getTicketFromBranch(branch);
        }

        if (!issueKey) {
          setAppState('no-issue');
          return;
        }

        try {
          const client = createClient();
          const issue = await client.getIssue(issueKey);
          setJiraIssue(issue);
          setAppState('confirm');
        } catch (jiraError) {
          setError(
            `Could not fetch JIRA issue ${issueKey}: ${jiraError instanceof Error ? jiraError.message : 'Unknown error'}`
          );
          setAppState('error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAppState('error');
      }
    }

    initialize();
  }, [flags.time, flags.ticket]);

  const handleConfirm = async () => {
    if (!jiraIssue || !timeSpent) return;

    setAppState('creating');

    try {
      const client = createClient();
      const timeSpentSeconds = parseTimeToSeconds(timeSpent);

      await client.addWorklog(jiraIssue.key, {
        timeSpent: secondsToJiraFormat(timeSpentSeconds),
        comment: flags.description || 'Work logged via Bookr CLI',
        started: formatJiraDate(new Date()),
      });

      setAppState('success');
    } catch (error) {
      setError(
        `Failed to create worklog: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setAppState('error');
    }
  };

  const handleCancel = () => {
    setAppState('cancelled');
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>⏳ Loading...</Text>
      </Box>
    );
  }

  // Error state
  if (appState === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  // Invalid time format
  if (appState === 'invalid-time') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ {error}</Text>
        <Box marginTop={1}>
          <Text color="yellow">Valid time formats:</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text> • 2h30m (2 hours 30 minutes)</Text>
          <Text> • 1h15m (1 hour 15 minutes)</Text>
          <Text> • 45m (45 minutes)</Text>
          <Text> • 2.5h (2.5 hours)</Text>
          <Text> • 90m (90 minutes)</Text>
        </Box>
      </Box>
    );
  }

  // No JIRA issue found
  if (appState === 'no-issue') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginTop={1} flexDirection="column">
          {flags.ticket ? (
            <Text color="yellow">⚠️ No JIRA issue key provided</Text>
          ) : (
            <>
              <Text color="yellow">⚠️ No JIRA issue key found in branch "{currentBranch}"</Text>
              <Text color="gray">Expected format: feature/PROJ-123, bugfix/PROJ-456, etc.</Text>
            </>
          )}
          <Text color="gray">Usage: bookr [TICKET] [TIME] -m "description"</Text>
          <Text color="gray">Examples: bookr PROJ-123 2h30m -m "Fixed bug"</Text>
        </Box>
      </Box>
    );
  }

  // Confirmation state
  if (appState === 'confirm' && jiraIssue) {
    return (
      <ConfirmationPrompt
        issue={jiraIssue}
        timeSpent={timeSpent}
        description={flags.description || undefined}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  // Creating worklog state
  if (appState === 'creating') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text>⏳ Creating worklog...</Text>
      </Box>
    );
  }

  // Success state
  if (appState === 'success' && jiraIssue) {
    // Construct JIRA issue URL
    const client = createClient();
    const issueUrl = `${client.getBaseUrl()}/browse/${jiraIssue.key}`;

    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green" bold>
          ✅ Worklog created!
        </Text>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text color="yellow">Issue:</Text> {jiraIssue.key} - {jiraIssue.fields.summary}
          </Text>
          <Text>
            <Text color="yellow">Time:</Text> {formatTimeForDisplay(timeSpent)} ({timeSpent})
          </Text>
          {flags.description && (
            <Text>
              <Text color="yellow">Description:</Text> {flags.description}
            </Text>
          )}
          <Box marginTop={1}>
            <Text color="blue" underline>
              🔗 <Text color="cyan">{issueUrl}</Text>
            </Text>
          </Box>
        </Box>
      </Box>
    );
  }

  // Cancelled state
  if (appState === 'cancelled') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">❌ Worklog creation cancelled</Text>
      </Box>
    );
  }

  // Fallback
  return (
    <Box flexDirection="column" padding={1}>
      <Text>Unknown state</Text>
    </Box>
  );
};
