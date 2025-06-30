import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { createJiraClientFromEnv } from '../api/jira-client.js';
import { JiraIssue } from '../types/jira.js';
import { getCurrentBranch, extractJiraIssueKey, isGitRepository } from '../utils/git.js';
import { parseTimeToSeconds, isValidTimeFormat, formatTimeForDisplay, secondsToJiraFormat, formatJiraDate } from '../utils/time-parser.js';
import { ConfirmationPrompt } from './ConfirmationPrompt.js';

interface AppProps {
  input: string[];
  flags: {
    time?: string | undefined;
    date?: string | undefined;
    description?: string | undefined;
  } & Record<string, unknown>;
}

type AppState = 'loading' | 'error' | 'no-issue' | 'invalid-time' | 'confirm' | 'creating' | 'success' | 'cancelled';

export const App: React.FC<AppProps> = ({ input: _input, flags }) => {
  const [currentBranch, setCurrentBranch] = useState<string>('Loading...');
  const [jiraIssue, setJiraIssue] = useState<JiraIssue | null>(null);
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState<string>('');

  useEffect(() => {
    async function initialize() {
      try {
        // Check if we're in a Git repository
        if (!isGitRepository()) {
          setError('Not in a Git repository. Please run this command from a Git repository.');
          setAppState('error');
          return;
        }

        // Get current Git branch
        const branch = getCurrentBranch();
        setCurrentBranch(branch);

        // Check if time was provided
        if (!flags.time) {
          setError('No time specified. Please provide time (e.g., "2h30m", "1h15m", "45m")');
          setAppState('error');
          return;
        }

        // Validate time format
        if (!isValidTimeFormat(flags.time)) {
          setError(`Invalid time format: "${flags.time}". Use formats like "2h30m", "1h15m", "45m", "2.5h"`);
          setAppState('invalid-time');
          return;
        }

        setTimeSpent(flags.time);

        // Try to extract JIRA issue key from branch name
        const issueKey = extractJiraIssueKey(branch);
        
        if (!issueKey) {
          setAppState('no-issue');
          return;
        }

        try {
          const client = createJiraClientFromEnv();
          const issue = await client.getIssue(issueKey);
          setJiraIssue(issue);
          setAppState('confirm');
        } catch (jiraError) {
          setError(`Could not fetch JIRA issue ${issueKey}: ${jiraError instanceof Error ? jiraError.message : 'Unknown error'}`);
          setAppState('error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAppState('error');
      }
    }

    initialize();
  }, [flags.time]);

  const handleConfirm = async () => {
    if (!jiraIssue || !timeSpent) return;
    
    setAppState('creating');
    
    try {
      const client = createJiraClientFromEnv();
      const timeSpentSeconds = parseTimeToSeconds(timeSpent);
      
      await client.addWorklog(jiraIssue.key, {
        timeSpent: secondsToJiraFormat(timeSpentSeconds),
        comment: flags.description || `Work logged via Bookr CLI`,
        started: formatJiraDate(new Date())
      });
      
      setAppState('success');
    } catch (error) {
      setError(`Failed to create worklog: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        <Text color="green" bold>
          🧪 Bookr - Tempo CLI Tool
        </Text>
        <Box marginTop={1}>
          <Text>⏳ Loading...</Text>
        </Box>
      </Box>
    );
  }

  // Error state
  if (appState === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green" bold>
          🧪 Bookr - Tempo CLI Tool
        </Text>
        <Text color="red">
          ❌ Error: {error}
        </Text>
      </Box>
    );
  }

  // Invalid time format
  if (appState === 'invalid-time') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green" bold>
          🧪 Bookr - Tempo CLI Tool
        </Text>
        <Text color="red">
          ❌ {error}
        </Text>
        <Box marginTop={1}>
          <Text color="yellow">Valid time formats:</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text>  • 2h30m (2 hours 30 minutes)</Text>
          <Text>  • 1h15m (1 hour 15 minutes)</Text>
          <Text>  • 45m (45 minutes)</Text>
          <Text>  • 2.5h (2.5 hours)</Text>
          <Text>  • 90m (90 minutes)</Text>
        </Box>
      </Box>
    );
  }

  // No JIRA issue found
  if (appState === 'no-issue') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green" bold>
          🧪 Bookr - Tempo CLI Tool
        </Text>
        <Text>
          Welcome to Bookr! A CLI tool to book time in Jira using Tempo.
        </Text>
        
        <Box marginTop={1}>
          <Text color="yellow">
            Current branch: {currentBranch}
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text color="blue">
            ⏱️  Time to log: {formatTimeForDisplay(timeSpent)} ({timeSpent})
          </Text>
        </Box>
        
        {flags.description && (
          <Box marginTop={1}>
            <Text color="blue">
              📝 Description: {flags.description}
            </Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color="yellow">
            ⚠️  No JIRA issue key found in branch name "{currentBranch}"
          </Text>
          <Text color="gray">
            Expected format: feature/PROJ-123, bugfix/PROJ-456, etc.
          </Text>
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
        <Text color="green" bold>
          🧪 Bookr - Tempo CLI Tool
        </Text>
        <Box marginTop={1}>
          <Text>⏳ Creating worklog...</Text>
        </Box>
      </Box>
    );
  }

  // Success state
  if (appState === 'success' && jiraIssue) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green" bold>
          🧪 Bookr - Tempo CLI Tool
        </Text>
        <Box marginTop={1}>
          <Text color="green" bold>
            ✅ Worklog created successfully!
          </Text>
        </Box>
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
        </Box>
      </Box>
    );
  }

  // Cancelled state
  if (appState === 'cancelled') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="green" bold>
          🧪 Bookr - Tempo CLI Tool
        </Text>
        <Box marginTop={1}>
          <Text color="yellow">
            ❌ Worklog creation cancelled
          </Text>
        </Box>
      </Box>
    );
  }

  // Fallback
  return (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>
        🧪 Bookr - Tempo CLI Tool
      </Text>
      <Text>Unknown state</Text>
    </Box>
  );
}; 