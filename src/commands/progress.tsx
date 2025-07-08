import { Box, Text, render } from 'ink';
import { createClient } from '../api/jira-client.js';
import { createTempoClient } from '../api/tempo-client.js';
import type { TempoWorklog, TempoWorklogsResponse } from '../types/tempo.js';
import { ProgressTable } from '../components/ProgressTable.js';

// Assuming 8 hours per day as standard workday
const HOURS_PER_DAY = 8;

function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()] || 'Unknown';
}

function getWorkingDaysInRange(startDate: Date, endDate: Date): Date[] {
  const workingDays: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      workingDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

function groupWorklogsByDate(worklogs: TempoWorklog[]): Map<string, number> {
  const grouped = new Map<string, number>();
  
  for (const worklog of worklogs) {
    if (worklog.started) {
      const date = worklog.started.split('T')[0]; // Get YYYY-MM-DD part
      if (date) {
        const hours = (worklog.timeSpentSeconds || 0) / 3600;
        const currentHours = grouped.get(date) || 0;
        grouped.set(date, currentHours + hours);
      }
    }
  }
  
  return grouped;
}

export async function showSprintProgress(): Promise<void> {
  try {
    const client = createClient();
    const tempoClient = createTempoClient();
    
    // Get current sprint
    const sprint = await client.getCurrentSprint();
    
    if (!sprint.startDate || !sprint.endDate) {
      console.log('❌ Current sprint does not have valid start or end dates.');
      return;
    }

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    
    // Convert to local dates to avoid timezone issues
    const fromISO = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const toISO = endDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    // Get current user
    const user = await client.getCurrentUser();
    
    // Get worklogs for sprint period
    const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, fromISO, toISO);
    const tempoWorklogs = (tempoWorklogsResponse && typeof tempoWorklogsResponse === 'object' && Array.isArray((tempoWorklogsResponse as TempoWorklogsResponse).results))
      ? (tempoWorklogsResponse as TempoWorklogsResponse).results
      : Array.isArray(tempoWorklogsResponse) ? tempoWorklogsResponse as TempoWorklog[] : [];

    // Group worklogs by date
    const worklogsByDate = groupWorklogsByDate(tempoWorklogs);
    
    // Get working days in sprint
    const workingDays = getWorkingDaysInRange(startDate, endDate);
    
    // Calculate daily progress
    const dailyProgress = workingDays.map(day => {
      const dateISO = day.toLocaleDateString('en-CA'); // Use local date
      const hoursLogged = worklogsByDate.get(dateISO) || 0;
      const hoursPlanned = HOURS_PER_DAY;
      const percentage = (hoursLogged / hoursPlanned) * 100;
      return {
        dayName: getDayName(day),
        date: dateISO,
        hoursLogged,
        percentage
      };
    });
    
    // Calculate total progress
    const totalHoursLogged = dailyProgress.reduce((sum, day) => sum + day.hoursLogged, 0);
    const totalHoursPlanned = dailyProgress.length * HOURS_PER_DAY;
    const totalPercentage = (totalHoursLogged / totalHoursPlanned) * 100;

    // Render the progress table
    render(
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          🏃 Sprint: {sprint.name}
        </Text>
        <Text color="gray">
          📅 {fromISO} to {toISO}
        </Text>
        <ProgressTable
          rows={dailyProgress}
          title="📊 Sprint Progress"
          totalHours={totalHoursLogged}
          totalPercentage={totalPercentage}
          sprintName={sprint.name}
        />
      </Box>
    );
  } catch (error) {
    console.error('❌ Error fetching sprint progress:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export default showSprintProgress; 