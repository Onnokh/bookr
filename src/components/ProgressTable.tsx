import { Box, Text } from 'ink';
import type React from 'react';

export interface ProgressRow {
  dayName: string;
  date: string;
  hoursLogged: number;
  percentage: number;
}

interface ProgressTableProps {
  rows: ProgressRow[];
  title?: string;
  totalHours: number;
  totalPercentage: number;
  sprintName: string;
}

function formatHours(hours: number): string {
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

export const ProgressTable: React.FC<ProgressTableProps> = ({ rows, title = 'Progress', totalHours, totalPercentage, sprintName }) => {
  // Determine column widths
  const maxDayLength = Math.max(6, ...rows.map(r => r.dayName.length));
  const maxDateLength = Math.max(10, ...rows.map(r => r.date.length));
  const maxHoursLength = Math.max(5, ...rows.map(r => formatHours(r.hoursLogged).length));
  const maxPercLength = Math.max(4, ...rows.map(r => formatPercentage(r.percentage).length));

  const separatorLength = maxDayLength + 3 + maxDateLength + 3 + maxHoursLength + 3 + maxPercLength;
  const separator = '─'.repeat(separatorLength);

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>{title}</Text>
      <Text color="gray">{separator}</Text>
      {/* Header */}
      <Box>
        <Text color="yellow" bold>{'Day'.padEnd(maxDayLength)} | </Text>
        <Text color="yellow" bold>{'Date'.padEnd(maxDateLength)} | </Text>
        <Text color="yellow" bold>{'Hours'.padEnd(maxHoursLength)} | </Text>
        <Text color="yellow" bold>{'%'}</Text>
      </Box>
      <Text color="gray">{separator}</Text>
      {/* Rows */}
      {rows.map((row, idx) => (
        <Box key={idx}>
          <Text>{row.dayName.padEnd(maxDayLength)} | </Text>
          <Text>{row.date.padEnd(maxDateLength)} | </Text>
          <Text>{formatHours(row.hoursLogged).padEnd(maxHoursLength)} | </Text>
          <Text color={row.percentage >= 100 ? 'green' : row.percentage >= 75 ? 'yellow' : 'red'}>{formatPercentage(row.percentage).padEnd(maxPercLength)}</Text>
        </Box>
      ))}
      <Text color="gray">{separator}</Text>
      {/* Sprint summary */}
      <Box marginTop={1}>
        <Text color="cyan" bold>
          Sprint: {sprintName} - {formatHours(totalHours)} - {formatPercentage(totalPercentage)}
        </Text>
      </Box>
    </Box>
  );
}; 