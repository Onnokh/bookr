/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const startFormatted = startDate.toLocaleDateString();
  const endFormatted = endDate.toLocaleDateString();

  return `${startFormatted} - ${endFormatted}`;
}
