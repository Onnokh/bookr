import { Box, Text } from 'ink';
import type React from 'react';

export interface ProgressRow {
  dayName: string;
  date: string;
  hoursLogged: number;
  hoursRequired?: number;
  percentage: number | string;
}

interface ProgressTableProps {
  rows: ProgressRow[];
  title?: string;
  showWorkload?: boolean;
}

function formatHours(hours: number): string {
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function formatPercentage(percentage: number | string): string {
  if (typeof percentage === 'string') return `${percentage}%`;
  return `${percentage.toFixed(1)}%`;
}

export const ProgressTable: React.FC<ProgressTableProps> = ({ 
  rows, 
  title = 'Progress', 
  showWorkload = false 
}) => {
  // Determine column widths
  const maxDayLength = Math.max(6, ...rows.map(r => r.dayName.length));
  const maxDateLength = Math.max(10, ...rows.map(r => r.date.length));
  const maxHoursLength = Math.max(5, ...rows.map(r => formatHours(r.hoursLogged).length));
  const maxRequiredLength = showWorkload ? Math.max(8, ...rows.map(r => formatHours(r.hoursRequired || 0).length)) : 0;
  const maxPercLength = Math.max(4, ...rows.map(r => formatPercentage(r.percentage).length));

  const separatorLength = maxDayLength + 3 + maxDateLength + 3 + maxHoursLength + 3 + 
                         (showWorkload ? maxRequiredLength + 3 : 0) +
                         maxPercLength;
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
        {showWorkload && <Text color="yellow" bold>{'Required'.padEnd(maxRequiredLength)} | </Text>}
        <Text color="yellow" bold>{'%'}</Text>
      </Box>
      <Text color="gray">{separator}</Text>
      {/* Rows */}
      {rows.map((row) => {
        let color: 'green' | 'yellow' | 'red' = 'red';
        if (row.percentage === '100+' || (typeof row.percentage === 'number' && row.percentage >= 100)) {
          color = 'green';
        } else if (typeof row.percentage === 'number' && row.percentage >= 75) {
          color = 'yellow';
        }
        return (
          <Box key={`${row.date}-${row.dayName}`}>
            <Text>{row.dayName.padEnd(maxDayLength)} | </Text>
            <Text>{row.date.padEnd(maxDateLength)} | </Text>
            <Text>{formatHours(row.hoursLogged).padEnd(maxHoursLength)} | </Text>
            {showWorkload && <Text>{formatHours(row.hoursRequired || 0).padEnd(maxRequiredLength)} | </Text>}
            <Text color={color}>{formatPercentage(row.percentage).padEnd(maxPercLength)}</Text>
          </Box>
        );
      })}
    </Box>
  );
}; 