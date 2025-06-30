import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { JiraIssue } from '../types/jira.js';
import { formatTimeForDisplay } from '../utils/time-parser.js';

interface ConfirmationPromptProps {
  issue: JiraIssue;
  timeSpent: string;
  description?: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationPrompt: React.FC<ConfirmationPromptProps> = ({
  issue,
  timeSpent,
  description,
  onConfirm,
  onCancel
}) => {
  const [selectedOption, setSelectedOption] = useState<'confirm' | 'cancel'>('confirm');

  useInput((input, key) => {
    if (key.upArrow || key.downArrow) {
      setSelectedOption(prev => prev === 'confirm' ? 'cancel' : 'confirm');
    } else if (key.return) {
      if (selectedOption === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    } else if (input.toLowerCase() === 'y' || input.toLowerCase() === 'n') {
      if (input.toLowerCase() === 'y') {
        onConfirm();
      } else {
        onCancel();
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>
        📋 Confirm Worklog Entry
      </Text>
      
      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text color="yellow">Issue:</Text> {issue.key} - {issue.fields.summary}
        </Text>
        <Text>
          <Text color="yellow">Project:</Text> {issue.fields.project.name}
        </Text>
        <Text>
          <Text color="yellow">Status:</Text> {issue.fields.status.name}
        </Text>
        <Text>
          <Text color="yellow">Time:</Text> {formatTimeForDisplay(timeSpent)} ({timeSpent})
        </Text>
        {description && (
          <Text>
            <Text color="yellow">Description:</Text> {description}
          </Text>
        )}
      </Box>

      <Box marginTop={2} flexDirection="column">
        <Text color="gray">
          Use ↑↓ arrows to select, Enter to confirm, or type y/n
        </Text>
        
        <Box marginTop={1}>
          <Text color={selectedOption === 'confirm' ? 'green' : 'gray'}>
            {selectedOption === 'confirm' ? '► ' : '  '}
          </Text>
          <Text color={selectedOption === 'confirm' ? 'green' : 'gray'}>
            ✅ Confirm and create worklog
          </Text>
        </Box>
        
        <Box>
          <Text color={selectedOption === 'cancel' ? 'red' : 'gray'}>
            {selectedOption === 'cancel' ? '► ' : '  '}
          </Text>
          <Text color={selectedOption === 'cancel' ? 'red' : 'gray'}>
            ❌ Cancel
          </Text>
        </Box>
      </Box>
    </Box>
  );
};