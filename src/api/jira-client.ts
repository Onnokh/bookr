import fs from 'node:fs';
import path from 'node:path';
import envPaths from 'env-paths';
import type { JiraAuth, JiraError, JiraIssue, JiraUser, JiraWorklog } from '../types/jira.js';

function loadConfigFromFile(): Partial<JiraAuth> | null {
  try {
    const configFile = path.join(envPaths('bookr').config, 'config.json');
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        baseUrl: parsed.JIRA_BASE_URL,
        email: parsed.JIRA_EMAIL,
        apiToken: parsed.JIRA_API_TOKEN,
      };
    }
    return null;
  } catch (_e) {
    return null;
  }
}

export class JiraClient {
  private auth: JiraAuth;
  private baseHeaders: Record<string, string>;

  constructor(auth: JiraAuth) {
    this.auth = auth;
    this.baseHeaders = {
      Authorization: `Basic ${Buffer.from(`${auth.email}:${auth.apiToken}`).toString('base64')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get a JIRA issue by key (e.g., "PROJ-123")
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    const url = `${this.auth.baseUrl}/rest/api/3/issue/${issueKey}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as JiraError;
        throw new Error(
          `Failed to get issue: ${errorData.errorMessages?.join(', ') || response.statusText}`
        );
      }

      return (await response.json()) as JiraIssue;
    } catch (error) {
      throw new Error(
        `Error fetching issue ${issueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<JiraUser> {
    const url = `${this.auth.baseUrl}/rest/api/3/myself`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as JiraError;
        throw new Error(
          `Failed to get current user: ${errorData.errorMessages?.join(', ') || response.statusText}`
        );
      }

      return (await response.json()) as JiraUser;
    } catch (error) {
      throw new Error(
        `Error fetching current user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Add a worklog entry to a JIRA issue
   */
  async addWorklog(
    issueKey: string,
    worklog: Omit<JiraWorklog, 'id' | 'author'>
  ): Promise<JiraWorklog> {
    const url = `${this.auth.baseUrl}/rest/api/3/issue/${issueKey}/worklog`;
    try {
      // Convert the worklog to the correct JIRA API format
      const apiWorklog = {
        timeSpentSeconds: worklog.timeSpentSeconds || this.parseTimeToSeconds(worklog.timeSpent),
        comment: worklog.comment
          ? {
              content: [
                {
                  content: [
                    {
                      text: worklog.comment,
                      type: 'text',
                    },
                  ],
                  type: 'paragraph',
                },
              ],
              type: 'doc',
              version: 1,
            }
          : undefined,
        started: worklog.started,
      };

      const requestBody = JSON.stringify(apiWorklog);
      const response = await fetch(url, {
        method: 'POST',
        headers: this.baseHeaders,
        body: requestBody,
      });
      if (!response.ok) {
        const errorData = (await response.json()) as JiraError;
        throw new Error(
          `Failed to add worklog: ${errorData.errorMessages?.join(', ') || response.statusText}`
        );
      }
      return (await response.json()) as JiraWorklog;
    } catch (error) {
      throw new Error(
        `Error adding worklog to ${issueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse time string to seconds (helper method)
   */
  private parseTimeToSeconds(timeString: string): number {
    const normalized = timeString.toLowerCase().trim();

    // Handle decimal hours: "2.5h", "1.25h"
    const decimalHoursMatch = normalized.match(/^(\d+(?:\.\d+)?)h?$/);
    if (decimalHoursMatch?.[1]) {
      const hours = Number.parseFloat(decimalHoursMatch[1]);
      return Math.round(hours * 3600);
    }

    // Handle hours and minutes: "2h30m", "1h15m", "2h", "30m"
    const hoursMatch = normalized.match(/(\d+)h/);
    const minutesMatch = normalized.match(/(\d+)m/);

    const hours = hoursMatch?.[1] ? Number.parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch?.[1] ? Number.parseInt(minutesMatch[1], 10) : 0;

    return hours * 3600 + minutes * 60;
  }

  /**
   * Get worklogs for a JIRA issue
   */
  async getWorklogs(issueKey: string): Promise<{ worklogs: JiraWorklog[] }> {
    const url = `${this.auth.baseUrl}/rest/api/3/issue/${issueKey}/worklog`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as JiraError;
        throw new Error(
          `Failed to get worklogs: ${errorData.errorMessages?.join(', ') || response.statusText}`
        );
      }

      return (await response.json()) as { worklogs: JiraWorklog[] };
    } catch (error) {
      throw new Error(
        `Error fetching worklogs for ${issueKey}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the base URL for constructing JIRA issue links
   */
  getBaseUrl(): string {
    return this.auth.baseUrl;
  }

  /**
   * Test the connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Search for issues using JQL (JIRA Query Language)
   */
  async searchIssues(
    jql: string,
    maxResults = 10
  ): Promise<{ issues: JiraIssue[]; total: number }> {
    const url = `${this.auth.baseUrl}/rest/api/3/search`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify({
          jql,
          maxResults,
          fields: ['summary', 'status', 'project'],
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as JiraError;
        throw new Error(
          `Failed to search issues: ${errorData.errorMessages?.join(', ') || response.statusText}`
        );
      }

      const data = (await response.json()) as { issues: JiraIssue[]; total: number };
      return data;
    } catch (error) {
      throw new Error(
        `Error searching issues: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get recent issues assigned to current user
   */
  async getMyRecentIssues(maxResults = 5): Promise<JiraIssue[]> {
    const jql = 'assignee = currentUser() ORDER BY updated DESC';
    const result = await this.searchIssues(jql, maxResults);
    return result.issues;
  }

  /**
   * Get today's worklogs for the current user
   */
  async getTodayWorklogs(): Promise<Array<{ issue: JiraIssue; worklog: JiraWorklog }>> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Format dates for JQL
    const startDate = startOfDay.toISOString().split('T')[0];
    const endDate = endOfDay.toISOString().split('T')[0];

    // Search for issues with worklogs created today by current user
    const jql = `worklogDate >= "${startDate}" AND worklogDate <= "${endDate}" AND worklogAuthor = currentUser() ORDER BY updated DESC`;

    try {
      const result = await this.searchIssues(jql, 50);
      const worklogsWithIssues: Array<{ issue: JiraIssue; worklog: JiraWorklog }> = [];

      for (const issue of result.issues) {
        const worklogsResponse = await this.getWorklogs(issue.key);
        const todayWorklogs = worklogsResponse.worklogs.filter((worklog) => {
          if (!worklog.started) return false;

          const worklogDate = new Date(worklog.started);
          return worklogDate >= startOfDay && worklogDate <= endOfDay;
        });

        for (const worklog of todayWorklogs) {
          worklogsWithIssues.push({ issue, worklog });
        }
      }

      // Sort by worklog start time (most recent first)
      return worklogsWithIssues.sort((a, b) => {
        const dateA = new Date(a.worklog.started || '');
        const dateB = new Date(b.worklog.started || '');
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      throw new Error(
        `Error fetching today's worklogs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current active sprint from the first board
   */
  async getCurrentSprint(): Promise<{
    id: number;
    name: string;
    startDate?: string;
    endDate?: string;
  }> {
    const boards = await this.getBoards();
    if (!boards.length) {
      throw new Error('No boards found');
    }

    // Use the first board (you might want to make this configurable)
    const boardId = boards[0]?.id;
    if (!boardId) {
      throw new Error('Invalid board configuration');
    }

    const sprintUrl = `${this.auth.baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active`;

    const sprintResponse = await fetch(sprintUrl, {
      method: 'GET',
      headers: this.baseHeaders,
    });
    if (!sprintResponse.ok) {
      const errorData = (await sprintResponse.json()) as JiraError;
      throw new Error(
        `Failed to get current sprint: ${errorData.errorMessages?.join(', ') || sprintResponse.statusText}`
      );
    }
    const sprints = (await sprintResponse.json()) as {
      values: Array<{ id: number; name: string; startDate?: string; endDate?: string }>;
    };
    if (!sprints.values.length) {
      throw new Error('No active sprint found');
    }
    const sprint = sprints.values[0];
    if (!sprint) {
      throw new Error('No active sprint found');
    }
    return sprint;
  }

  /**
   * Get all boards
   */
  async getBoards(): Promise<Array<{ id: number; name: string }>> {
    const url = `${this.auth.baseUrl}/rest/agile/1.0/board`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.baseHeaders,
    });
    if (!response.ok) {
      const errorData = (await response.json()) as JiraError;
      throw new Error(
        `Failed to get boards: ${errorData.errorMessages?.join(', ') || response.statusText}`
      );
    }
    const boards = (await response.json()) as { values: Array<{ id: number; name: string }> };
    return boards.values;
  }

  /**
   * Get all sprints for a board (active, future, closed)
   */
  async getSprintsForBoard(
    boardId: number
  ): Promise<
    Array<{ id: number; name: string; state: string; startDate?: string; endDate?: string }>
  > {
    const url = `${this.auth.baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active,future,closed&maxResults=100&orderBy=startDate DESC`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.baseHeaders,
    });
    if (!response.ok) {
      const errorData = (await response.json()) as JiraError;
      throw new Error(
        `Failed to get sprints: ${errorData.errorMessages?.join(', ') || response.statusText}`
      );
    }
    const sprints = (await response.json()) as {
      values: Array<{
        id: number;
        name: string;
        state: string;
        startDate?: string;
        endDate?: string;
      }>;
      isLast: boolean;
      maxResults: number;
      startAt: number;
      total: number;
    };

    // If there are more sprints, fetch them
    let allSprints = [...sprints.values];
    let startAt = sprints.startAt + sprints.maxResults;

    while (!sprints.isLast && allSprints.length < sprints.total) {
      const nextUrl = `${this.auth.baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active,future,closed&maxResults=100&startAt=${startAt}&orderBy=startDate DESC`;
      const nextResponse = await fetch(nextUrl, {
        method: 'GET',
        headers: this.baseHeaders,
      });

      if (!nextResponse.ok) {
        const errorData = (await nextResponse.json()) as JiraError;
        throw new Error(
          `Failed to get sprints: ${errorData.errorMessages?.join(', ') || nextResponse.statusText}`
        );
      }

      const nextSprints = (await nextResponse.json()) as {
        values: Array<{
          id: number;
          name: string;
          state: string;
          startDate?: string;
          endDate?: string;
        }>;
        isLast: boolean;
        maxResults: number;
        startAt: number;
        total: number;
      };
      allSprints = [...allSprints, ...nextSprints.values];
      startAt += nextSprints.maxResults;

      if (nextSprints.isLast) break;
    }

    return allSprints;
  }

  /**
   * Search for worklogs by current user within a date range
   */
  async searchWorklogsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ issue: JiraIssue; worklog: JiraWorklog }>> {
    // Format dates for JQL
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Search for issues with worklogs in the date range by current user
    const jql = `worklogDate >= "${startDateStr}" AND worklogDate <= "${endDateStr}" AND worklogAuthor = currentUser() ORDER BY updated DESC`;

    console.log(`🔍 JQL Query: ${jql}`);

    try {
      const result = await this.searchIssues(jql, 500); // Higher limit for comprehensive search
      console.log(`📊 Found ${result.issues.length} issues with worklogs in date range`);

      const worklogsWithIssues: Array<{ issue: JiraIssue; worklog: JiraWorklog }> = [];

      for (const issue of result.issues) {
        try {
          const worklogsResponse = await this.getWorklogs(issue.key);
          const filteredWorklogs = worklogsResponse.worklogs.filter((worklog) => {
            if (!worklog.started) return false;

            const worklogDate = new Date(worklog.started);
            return worklogDate >= startDate && worklogDate <= endDate;
          });

          if (filteredWorklogs.length > 0) {
            console.log(
              `📝 ${issue.key}: Found ${filteredWorklogs.length} worklogs in sprint period`
            );
          }

          for (const worklog of filteredWorklogs) {
            worklogsWithIssues.push({ issue, worklog });
          }
        } catch (error) {
          // Skip issues where we can't fetch worklogs
          console.log(
            `⚠️  Could not fetch worklogs for ${issue.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      console.log(`📊 Total worklog entries found: ${worklogsWithIssues.length}`);

      // Sort by worklog start time (most recent first)
      return worklogsWithIssues.sort((a, b) => {
        const dateA = new Date(a.worklog.started || '');
        const dateB = new Date(b.worklog.started || '');
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      throw new Error(
        `Error searching worklogs by date range: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Create a JIRA client from environment variables
 */
export function createJiraClientFromEnv(): JiraClient {
  // Try config file first
  const fileConfig = loadConfigFromFile();
  const baseUrl = fileConfig?.baseUrl || process.env['JIRA_BASE_URL'];
  const email = fileConfig?.email || process.env['JIRA_EMAIL'];
  const apiToken = fileConfig?.apiToken || process.env['JIRA_API_TOKEN'];

  if (!baseUrl || !email || !apiToken) {
    throw new Error(
      'Missing JIRA configuration. Please run `bookr init` or set the following environment variables:\n' +
        '- JIRA_BASE_URL (e.g., https://your-domain.atlassian.net)\n' +
        '- JIRA_EMAIL (your JIRA email)\n' +
        '- JIRA_API_TOKEN (your JIRA API token)\n\n' +
        'You can set these in ~/.config/bookr/config.json or as environment variables.'
    );
  }

  return new JiraClient({ baseUrl, email, apiToken });
}
