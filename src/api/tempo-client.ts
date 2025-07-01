/**
 * Tempo API client for worklog-related tasks
 * Docs: https://apidocs.tempo.io/
 */

import { loadConfigFromFile } from '../utils/config.js';

export class TempoClient {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
  }

  /**
   * Fetch worklogs for a user for a given date range (Tempo API v4)
   */
  async getWorklogsForUser(accountId: string, from: string, to: string) {
    const url = `${this.baseUrl}/worklogs/user/${encodeURIComponent(accountId)}`;
    const params = new URLSearchParams({ from, to, limit: '1000' });
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch Tempo worklogs: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }

  /**
   * Add a worklog for a user
   */
  async addWorklog(_worklogData: any) {
    // TODO: Implement API call to add a worklog
    // Endpoint: POST /worklogs
    throw new Error('Not implemented');
  }

  /**
   * Delete a worklog by ID
   */
  async deleteWorklog(_worklogId: string) {
    // TODO: Implement API call to delete a worklog
    // Endpoint: DELETE /worklogs/{id}
    throw new Error('Not implemented');
  }
}

export function createTempoClient(): TempoClient {
  const fileConfig = loadConfigFromFile();
  const baseUrl =  'https://api.tempo.io/4';
  const apiToken = fileConfig?.tempoApiToken;

  if (!baseUrl || !apiToken) {
    throw new Error(
      'Missing Tempo configuration. Please set tempoApiToken in your config file.'
    );
  }

  return new TempoClient(baseUrl, apiToken);
} 