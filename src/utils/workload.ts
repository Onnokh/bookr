import type { TempoWorkloadScheme } from '../types/tempo.js';

/**
 * Get the required hours for a specific day of the week
 */
export function getRequiredHoursForDay(workloadScheme: TempoWorkloadScheme, dayName: string): number {
  const day = workloadScheme.days.find(d => d.day.toUpperCase() === dayName.toUpperCase());
  return day ? day.requiredSeconds / 3600 : 0;
}

/**
 * Get the required hours for a specific date
 */
export function getRequiredHoursForDate(workloadScheme: TempoWorkloadScheme, date: Date): number {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayName = days[date.getDay()] || 'SUNDAY';
  return getRequiredHoursForDay(workloadScheme, dayName);
}

/**
 * Calculate total required hours for a date range based on workload scheme
 */
export function getTotalRequiredHours(workloadScheme: TempoWorkloadScheme, startDate: Date, endDate: Date): number {
  let totalHours = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    totalHours += getRequiredHoursForDate(workloadScheme, current);
    current.setDate(current.getDate() + 1);
  }
  
  return totalHours;
}

/**
 * Get working days in a range based on workload scheme (days with > 0 required hours)
 */
export function getWorkingDaysInRange(startDate: Date, endDate: Date): Date[] {
  const workingDays: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Include all days, not just those with required hours > 0
    workingDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

/**
 * Calculate daily progress with workload awareness
 */
export function calculateDailyProgress(
  worklogsByDate: Map<string, number>,
  workingDays: Date[],
  workloadScheme: TempoWorkloadScheme
): Array<{
  dayName: string;
  date: string;
  hoursLogged: number;
  hoursRequired: number;
  percentage: number | string;
}> {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return workingDays.map(day => {
    const dateISO = day.toLocaleDateString('en-CA'); // Use local date
    const hoursLogged = worklogsByDate.get(dateISO) || 0;
    const hoursRequired = getRequiredHoursForDate(workloadScheme, day);
    let percentage: number | string;
    if (hoursRequired === 0) {
      percentage = hoursLogged === 0 ? 100 : '100+';
    } else {
      percentage = (hoursLogged / hoursRequired) * 100;
    }
    return {
      dayName: days[day.getDay()] || 'Unknown',
      date: dateISO,
      hoursLogged,
      hoursRequired,
      percentage
    };
  });
}

/**
 * Calculate total percentage, treating 0/0 as 100% for those days
 */
export function calculateTotalPercentage(dailyProgress: Array<{ hoursLogged: number; hoursRequired: number; percentage: number | string; }>): number {
  if (dailyProgress.length === 0) return 0;
  let sum = 0;
  for (const day of dailyProgress) {
    if (day.hoursRequired === 0) {
      sum += 100;
    } else if (typeof day.percentage === 'number') {
      sum += Math.min(day.percentage, 100);
    } else {
      sum += 100;
    }
  }
  return sum / dailyProgress.length;
}

/**
 * Calculate required hours up to a specific date (inclusive)
 */
export function getRequiredHoursUpToDate(workloadScheme: TempoWorkloadScheme, startDate: Date, endDate: Date): number {
  let totalHours = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    totalHours += getRequiredHoursForDate(workloadScheme, current);
    current.setDate(current.getDate() + 1);
  }
  
  return totalHours;
} 