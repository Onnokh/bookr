import React from 'react';
import { Box, Text } from 'ink';

interface AppProps {
  input: string[];
  flags: {
    time?: string | undefined;
    date?: string | undefined;
    description?: string | undefined;
  } & Record<string, unknown>;
}

export const App: React.FC<AppProps> = ({ input: _input, flags }) => {
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
          Current branch: {getCurrentBranch()}
        </Text>
      </Box>
      {flags.time && (
        <Box marginTop={1}>
          <Text color="blue">
            Time to log: {flags.time}
          </Text>
        </Box>
      )}
      {flags.description && (
        <Box marginTop={1}>
          <Text color="blue">
            Description: {flags.description}
          </Text>
        </Box>
      )}
    </Box>
  );
};

function getCurrentBranch(): string {
  try {
    // This is a placeholder - we'll implement proper Git integration later
    return 'feature/TEMP-123-add-cli-tool';
  } catch (error) {
    return 'unknown';
  }
} 