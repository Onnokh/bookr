import { JiraAuth, JiraIssue, JiraWorklog, JiraUser } from '../types/jira.js';
export declare class JiraClient {
    private auth;
    private baseHeaders;
    constructor(auth: JiraAuth);
    /**
     * Get a JIRA issue by key (e.g., "PROJ-123")
     */
    getIssue(issueKey: string): Promise<JiraIssue>;
    /**
     * Get current user information
     */
    getCurrentUser(): Promise<JiraUser>;
    /**
     * Add a worklog entry to a JIRA issue
     */
    addWorklog(issueKey: string, worklog: Omit<JiraWorklog, 'id' | 'author'>): Promise<JiraWorklog>;
    /**
     * Parse time string to seconds (helper method)
     */
    private parseTimeToSeconds;
    /**
     * Get worklogs for a JIRA issue
     */
    getWorklogs(issueKey: string): Promise<{
        worklogs: JiraWorklog[];
    }>;
    /**
     * Test the connection and authentication
     */
    testConnection(): Promise<boolean>;
    /**
     * Search for issues using JQL (JIRA Query Language)
     */
    searchIssues(jql: string, maxResults?: number): Promise<{
        issues: JiraIssue[];
        total: number;
    }>;
    /**
     * Get recent issues assigned to current user
     */
    getMyRecentIssues(maxResults?: number): Promise<JiraIssue[]>;
}
/**
 * Create a JIRA client from environment variables
 */
export declare function createJiraClientFromEnv(): JiraClient;
//# sourceMappingURL=jira-client.d.ts.map