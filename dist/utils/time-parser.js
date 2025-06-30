/**
 * Parse time string and convert to seconds
 * Supports formats like: "2h30m", "1h15m", "45m", "2.5h", "90m"
 */
export function parseTimeToSeconds(timeString) {
    const normalized = timeString.toLowerCase().trim();
    // Handle decimal hours: "2.5h", "1.25h"
    const decimalHoursMatch = normalized.match(/^(\d+(?:\.\d+)?)h?$/);
    if (decimalHoursMatch && decimalHoursMatch[1]) {
        const hours = parseFloat(decimalHoursMatch[1]);
        return Math.round(hours * 3600);
    }
    // Handle hours and minutes: "2h30m", "1h15m", "2h", "30m"
    const hoursMatch = normalized.match(/(\d+)h/);
    const minutesMatch = normalized.match(/(\d+)m/);
    const hours = hoursMatch && hoursMatch[1] ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch && minutesMatch[1] ? parseInt(minutesMatch[1], 10) : 0;
    return (hours * 3600) + (minutes * 60);
}
/**
 * Convert seconds to JIRA time format (e.g., "2h 30m")
 */
export function secondsToJiraFormat(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }
    else if (hours > 0) {
        return `${hours}h`;
    }
    else if (minutes > 0) {
        return `${minutes}m`;
    }
    else {
        return '0m';
    }
}
/**
 * Validate time string format
 */
export function isValidTimeFormat(timeString) {
    const normalized = timeString.toLowerCase().trim();
    // Check for decimal hours
    if (/^\d+(?:\.\d+)?h?$/.test(normalized)) {
        return true;
    }
    // Check for hours and minutes
    if (/^\d+h\d+m$/.test(normalized)) {
        return true;
    }
    // Check for just hours
    if (/^\d+h$/.test(normalized)) {
        return true;
    }
    // Check for just minutes
    if (/^\d+m$/.test(normalized)) {
        return true;
    }
    return false;
}
/**
 * Get human-readable time format for display
 */
export function formatTimeForDisplay(timeString) {
    const seconds = parseTimeToSeconds(timeString);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && minutes > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    else if (hours > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    else if (minutes > 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    else {
        return '0 minutes';
    }
}
export function formatJiraDate(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const SSS = date.getMilliseconds().toString().padStart(3, '0');
    // Correct sign and offset for local timezone
    const tzOffset = -date.getTimezoneOffset();
    const sign = tzOffset >= 0 ? '+' : '-';
    const tzHH = pad(Math.floor(Math.abs(tzOffset) / 60));
    const tzmm = pad(Math.abs(tzOffset) % 60);
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${SSS}${sign}${tzHH}${tzmm}`;
}
//# sourceMappingURL=time-parser.js.map