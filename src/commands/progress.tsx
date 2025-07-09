import { Box, Text, render } from 'ink';
import { createClient } from '../api/jira-client.js';
import { createTempoClient } from '../api/tempo-client.js';
import type { TempoWorklog, TempoWorklogsResponse } from '../types/tempo.js';
import { ProgressTable } from '../components/ProgressTable.js';
import { 
  getWorkingDaysInRange, 
  calculateDailyProgress, 
  getRequiredHoursUpToDate
} from '../utils/workload.js';
import type { TempoWorkloadScheme } from '../types/tempo.js';

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
    
    // Get user workload scheme
    let workloadScheme: TempoWorkloadScheme | undefined;
    try {
      const userWorkload = await tempoClient.getUserWorkload(user.accountId);
      if (userWorkload?.workloadScheme?.days && Array.isArray(userWorkload.workloadScheme.days)) {
        workloadScheme = userWorkload.workloadScheme;
      } else {
        throw new Error('Invalid workload scheme response');
      }
    } catch {
      console.log('⚠️  Could not fetch user workload scheme, using default 8 hours per day.');
      // Fallback to default 8 hours per day for weekdays
      workloadScheme = {
        days: [
          { day: 'MONDAY', requiredSeconds: 8 * 3600 },
          { day: 'TUESDAY', requiredSeconds: 8 * 3600 },
          { day: 'WEDNESDAY', requiredSeconds: 8 * 3600 },
          { day: 'THURSDAY', requiredSeconds: 8 * 3600 },
          { day: 'FRIDAY', requiredSeconds: 8 * 3600 },
        ],
        defaultScheme: true,
        description: 'Default 8-hour workday',
        id: 0,
        memberCount: 1,
        name: 'Default Workload',
        self: '',
      };
    }
    
    // Get worklogs for sprint period
    const tempoWorklogsResponse = await tempoClient.getWorklogsForUser(user.accountId, fromISO, toISO);
    const tempoWorklogs = (tempoWorklogsResponse && typeof tempoWorklogsResponse === 'object' && Array.isArray((tempoWorklogsResponse as TempoWorklogsResponse).results))
      ? (tempoWorklogsResponse as TempoWorklogsResponse).results
      : Array.isArray(tempoWorklogsResponse) ? tempoWorklogsResponse as TempoWorklog[] : [];

    // Group worklogs by date
    const worklogsByDate = groupWorklogsByDate(tempoWorklogs);
    
    // Get working days in sprint based on workload scheme
    const workingDays = getWorkingDaysInRange(startDate, endDate);
    
    // Calculate daily progress with workload awareness
    const dailyProgress = calculateDailyProgress(worklogsByDate, workingDays, workloadScheme);
    
    // Render the progress table
    render(
      <Box flexDirection="column" padding={1}>
        <Text color="cyan" bold>
          🏃 Sprint: {sprint.name}
        </Text>
        <Text color="gray">
          📅 {fromISO} to {toISO}
        </Text>
        <Text color="blue">
          📊 Workload: {workloadScheme?.name}
        </Text>
        <ProgressTable
          rows={dailyProgress}
          title="📊 Sprint Progress"
          showWorkload={true}
        />
        <Text color="gray">──────────────────────────────────────────────────</Text>
        {(() => {
          const today = new Date();
          const effectiveEndDate = today <= endDate ? today : endDate;
          // Up to now
          const upToNowRequired = getRequiredHoursUpToDate(workloadScheme, startDate, effectiveEndDate);
          const upToNowLogged = dailyProgress
            .filter(row => new Date(row.date) <= effectiveEndDate)
            .reduce((sum, row) => sum + row.hoursLogged, 0);
          const upToNowPerc = upToNowRequired > 0 ? (upToNowLogged / upToNowRequired) * 100 : 0;
          let upToNowColor: 'green' | 'yellow' | 'red' = 'red';
          if (upToNowPerc >= 100) upToNowColor = 'green';
          else if (upToNowPerc >= 75) upToNowColor = 'yellow';
          // Whole sprint
          const totalRequired = getRequiredHoursUpToDate(workloadScheme, startDate, endDate);
          const totalLogged = dailyProgress.reduce((sum, row) => sum + row.hoursLogged, 0);
          const totalPerc = totalRequired > 0 ? (totalLogged / totalRequired) * 100 : 0;
          let totalColor: 'green' | 'yellow' | 'red' = 'red';
          if (totalPerc >= 100) totalColor = 'green';
          else if (totalPerc >= 75) totalColor = 'yellow';
          return (
            <Text>
              <Text color="lightGray">Progress: </Text>
              <Text color={upToNowColor}>{upToNowLogged}h/{upToNowRequired}h ({upToNowPerc.toFixed(1)}%)</Text>
              <Text color="lightGray"> | Sprint: </Text>
              <Text color={totalColor}>{totalLogged}h/{totalRequired}h ({totalPerc.toFixed(1)}%)</Text>
            </Text>
          );
        })()}
      </Box>
    );
  } catch (error) {
    console.error('❌ Error fetching sprint progress:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export default showSprintProgress; 