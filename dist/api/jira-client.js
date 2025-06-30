import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
export class JiraClient {
    constructor(auth) {
        this.auth = auth;
        this.baseHeaders = {
            'Authorization': `Basic ${Buffer.from(`${auth.email}:${auth.apiToken}`).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
    }
    /**
     * Get a JIRA issue by key (e.g., "PROJ-123")
     */
    async getIssue(issueKey) {
        const url = `${this.auth.baseUrl}/rest/api/3/issue/${issueKey}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.baseHeaders,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to get issue: ${errorData.errorMessages?.join(', ') || response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            throw new Error(`Error fetching issue ${issueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get current user information
     */
    async getCurrentUser() {
        const url = `${this.auth.baseUrl}/rest/api/3/myself`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.baseHeaders,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to get current user: ${errorData.errorMessages?.join(', ') || response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            throw new Error(`Error fetching current user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Add a worklog entry to a JIRA issue
     */
    async addWorklog(issueKey, worklog) {
        const url = `${this.auth.baseUrl}/rest/api/3/issue/${issueKey}/worklog`;
        try {
            // Convert the worklog to the correct JIRA API format
            const apiWorklog = {
                timeSpentSeconds: worklog.timeSpentSeconds || this.parseTimeToSeconds(worklog.timeSpent),
                comment: worklog.comment ? {
                    content: [
                        {
                            content: [
                                {
                                    text: worklog.comment,
                                    type: 'text'
                                }
                            ],
                            type: 'paragraph'
                        }
                    ],
                    type: 'doc',
                    version: 1
                } : undefined,
                started: worklog.started
            };
            const requestBody = JSON.stringify(apiWorklog);
            console.log(`Debug: Sending worklog request to ${url}`);
            console.log(`Debug: Request body: ${requestBody}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: this.baseHeaders,
                body: requestBody,
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.log(`Debug: Response status: ${response.status}`);
                console.log(`Debug: Response body: ${JSON.stringify(errorData)}`);
                throw new Error(`Failed to add worklog: ${errorData.errorMessages?.join(', ') || response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            throw new Error(`Error adding worklog to ${issueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Parse time string to seconds (helper method)
     */
    parseTimeToSeconds(timeString) {
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
     * Get worklogs for a JIRA issue
     */
    async getWorklogs(issueKey) {
        const url = `${this.auth.baseUrl}/rest/api/3/issue/${issueKey}/worklog`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.baseHeaders,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to get worklogs: ${errorData.errorMessages?.join(', ') || response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            throw new Error(`Error fetching worklogs for ${issueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test the connection and authentication
     */
    async testConnection() {
        try {
            await this.getCurrentUser();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Search for issues using JQL (JIRA Query Language)
     */
    async searchIssues(jql, maxResults = 10) {
        const url = `${this.auth.baseUrl}/rest/api/3/search`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.baseHeaders,
                body: JSON.stringify({
                    jql,
                    maxResults,
                    fields: ['summary', 'status', 'project']
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to search issues: ${errorData.errorMessages?.join(', ') || response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            throw new Error(`Error searching issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get recent issues assigned to current user
     */
    async getMyRecentIssues(maxResults = 5) {
        const jql = 'assignee = currentUser() ORDER BY updated DESC';
        const result = await this.searchIssues(jql, maxResults);
        return result.issues;
    }
}
/**
 * Create a JIRA client from environment variables
 */
export function createJiraClientFromEnv() {
    const baseUrl = process.env['JIRA_BASE_URL'];
    const email = process.env['JIRA_EMAIL'];
    const apiToken = process.env['JIRA_API_TOKEN'];
    if (!baseUrl || !email || !apiToken) {
        throw new Error('Missing JIRA environment variables. Please set:\n' +
            '- JIRA_BASE_URL (e.g., https://your-domain.atlassian.net)\n' +
            '- JIRA_EMAIL (your JIRA email)\n' +
            '- JIRA_API_TOKEN (your JIRA API token)\n\n' +
            'You can set these in a .env file or as environment variables.');
    }
    return new JiraClient({ baseUrl, email, apiToken });
}
//# sourceMappingURL=jira-client.js.map