/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const startFormatted = startDate.toLocaleDateString();
  const endFormatted = endDate.toLocaleDateString();

  return `${startFormatted} - ${endFormatted}`;
}

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
