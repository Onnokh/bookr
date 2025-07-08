/**
 * Tempo API client for worklog-related tasks
 * Docs: https://apidocs.tempo.io/
 */

import { loadConfigFromFile } from '../utils/config.js';
import type { TempoWorklogCreateResponse } from '../types/tempo.js';

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
    let data: any = await response.json();
    // Map worklogs to add 'started' field
    if (Array.isArray(data.results)) {
      data.results = data.results.map((worklog: any) => {
        let started: string | undefined = undefined;
        if (worklog.startDate) {
          // If startTime is present, combine, else use 00:00:00
          const time = worklog.startTime ? worklog.startTime : '00:00:00';
          started = `${worklog.startDate}T${time}`;
        }
        return { ...worklog, started };
      });
    } else if (Array.isArray(data)) {
      // Defensive: if API returns array directly
      data = data.map((worklog: any) => {
        let started: string | undefined = undefined;
        if (worklog.startDate) {
          const time = worklog.startTime ? worklog.startTime : '00:00:00';
          started = `${worklog.startDate}T${time}`;
        }
        return { ...worklog, started };
      });
    }
    return data;
  }

  /**
   * Add a worklog for a user
   */
  async addWorklog(worklogData: {
    issueId: string;
    issueKey: string;
    timeSpentSeconds: number;
    comment?: string;
    startDate: string; // yyyy-MM-dd
    authorAccountId: string;
    startTime?: string; // HH:mm:ss format for start time
  }): Promise<TempoWorklogCreateResponse> {
    const url = `${this.baseUrl}/worklogs`;
    const payload = {
      issueId: worklogData.issueId,
      issueKey: worklogData.issueKey,
      timeSpentSeconds: worklogData.timeSpentSeconds,
      description: worklogData.comment || '',
      startDate: worklogData.startDate, // must be yyyy-MM-dd
      authorAccountId: worklogData.authorAccountId,
      ...(worklogData.startTime && { startTime: worklogData.startTime }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add Tempo worklog: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return (await response.json()) as TempoWorklogCreateResponse;
  }

  /**
   * Delete a worklog by ID
   */
  async deleteWorklog(worklogId: string) {
    const url = `${this.baseUrl}/worklogs/${worklogId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete Tempo worklog: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return true;
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