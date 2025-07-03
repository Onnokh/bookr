import type { JiraAuth, JiraError, JiraIssue, JiraUser } from '../types/jira.js';
import { loadConfigFromFile } from '../utils/config.js';

export class JiraClient {
  private auth: JiraAuth;
  private baseHeaders: Record<string, string>;

  constructor(auth: JiraAuth) {
    this.auth = auth;
    this.baseHeaders = {
      Authorization: `Basic ${Buffer.from(`${auth.email}:${auth.apiToken}`).toString('base64')}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'bookr-cli/1.0',
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
        // Clone the response before reading it to avoid consuming the stream
        const responseClone = response.clone();
        let errorMessage = response.statusText;
        
        try {
          const errorData = (await response.json()) as JiraError;
          errorMessage = errorData.errorMessages?.join(', ') || response.statusText;
        } catch {
          // If JSON parsing fails, try to get the response as text from the cloned response
          try {
            const textResponse = await responseClone.text();
            errorMessage = textResponse || response.statusText;
          } catch {
            errorMessage = response.statusText;
          }
        }
        
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Authentication failed. Please check your JIRA credentials and run `bookr init` to update them.'
          );
        }
        
        throw new Error(`Failed to get current user: ${errorMessage}`);
      }

      return (await response.json()) as JiraUser;
    } catch (error) {
      throw new Error(
        `Error fetching current user: ${error instanceof Error ? error.message : 'Unknown error'}`
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


}

/**
 * Create a JIRA client from environment variables
 */
export function createClient(): JiraClient {
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
