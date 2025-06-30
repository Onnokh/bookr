/**
 * Parse time string and convert to seconds
 * Supports formats like: "2h30m", "1h15m", "45m", "2.5h", "90m"
 */
export declare function parseTimeToSeconds(timeString: string): number;
/**
 * Convert seconds to JIRA time format (e.g., "2h 30m")
 */
export declare function secondsToJiraFormat(seconds: number): string;
/**
 * Validate time string format
 */
export declare function isValidTimeFormat(timeString: string): boolean;
/**
 * Get human-readable time format for display
 */
export declare function formatTimeForDisplay(timeString: string): string;
export declare function formatJiraDate(date: Date): string;
//# sourceMappingURL=time-parser.d.ts.map