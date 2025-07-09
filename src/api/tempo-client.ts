/**
 * Tempo API client for worklog-related tasks
 * Docs: https://apidocs.tempo.io/
 */

import { loadConfigFromFile } from '../utils/config.js';
import type { TempoWorklogCreateResponse, TempoUserWorkload, TempoWorkloadScheme } from '../types/tempo.js';

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
    let data: unknown = await response.json();
    // Map worklogs to add 'started' field
    if (Array.isArray((data as { results: unknown[] }).results)) {
      (data as { results: unknown[] }).results = (data as { results: unknown[] }).results.map((worklog: unknown) => {
        const worklogObj = worklog as Record<string, unknown>;
        let started: string | undefined = undefined;
        if (worklogObj['startDate']) {
          // If startTime is present, combine, else use 00:00:00
          const time = worklogObj['startTime'] ? worklogObj['startTime'] as string : '00:00:00';
          started = `${worklogObj['startDate'] as string}T${time}`;
        }
        return { ...worklogObj, started };
      });
    } else if (Array.isArray(data)) {
      // Defensive: if API returns array directly
      data = (data as unknown[]).map((worklog: unknown) => {
        const worklogObj = worklog as Record<string, unknown>;
        let started: string | undefined = undefined;
        if (worklogObj['startDate']) {
          const time = worklogObj['startTime'] ? worklogObj['startTime'] as string : '00:00:00';
          started = `${worklogObj['startDate'] as string}T${time}`;
        }
        return { ...worklogObj, started };
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

  /**
   * Get workload scheme for a user
   */
  async getUserWorkload(accountId: string): Promise<TempoUserWorkload> {
    // Try the user-specific endpoint first
    let url = `${this.baseUrl}/workload-schemes/users/${encodeURIComponent(accountId)}`;
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
      },
    });
    
    // If user-specific endpoint fails, try the general workload schemes endpoint
    if (!response.ok) {
      url = `${this.baseUrl}/workload-schemes`;
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch user workload: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // If we get the general schemes, try to find the default one
      const schemes = await response.json() as { results: TempoWorkloadScheme[] };
      const defaultScheme = schemes.results?.find(scheme => scheme.defaultScheme) || schemes.results?.[0];
      
      if (!defaultScheme) {
        throw new Error('No workload schemes found');
      }
      
      return {
        accountId,
        workloadScheme: defaultScheme,
      };
    }
    
    const data = await response.json() as unknown;
    
    // The user-specific endpoint returns the workload scheme directly, not wrapped
    // Check if it's already in the expected format
    if (typeof data === 'object' && data !== null && 'accountId' in data && 'workloadScheme' in data) {
      return data as TempoUserWorkload;
    }
    
    // If it's just the workload scheme, wrap it
    return {
      accountId,
      workloadScheme: data as TempoWorkloadScheme,
    };
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