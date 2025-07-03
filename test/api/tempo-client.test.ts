import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TempoClient } from '../../src/api/tempo-client';
import type { TempoWorklogCreateResponse } from '../../src/types/tempo';

// Mock fetch globally
const globalAny: any = global;
globalAny.fetch = vi.fn();

describe('TempoClient', () => {
  let client: TempoClient;
  const baseUrl = 'https://api.tempo.io/4';
  const apiToken = 'fake-token';

  beforeEach(() => {
    client = new TempoClient(baseUrl, apiToken);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('addWorklog', () => {
    it('should add a worklog successfully', async () => {
      const mockResponse: TempoWorklogCreateResponse = {
        tempoWorklogId: 12345,
        timeSpentSeconds: 3600,
        timeSpent: '1h',
        description: 'Test work',
        started: '2024-01-15T10:00:00.000+0000',
        issue: { id: '1', key: 'PROJ-1' },
        author: { accountId: 'user1', name: 'Test User', displayName: 'Test User' },
      };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.addWorklog({
        issueKey: 'PROJ-1',
        timeSpentSeconds: 3600,
        comment: 'Test work',
        started: '2024-01-15T10:00:00.000+0000',
        authorAccountId: 'user1',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid data'),
      });
      await expect(
        client.addWorklog({
          issueKey: 'PROJ-1',
          timeSpentSeconds: 3600,
          comment: 'Test work',
          started: '2024-01-15T10:00:00.000+0000',
          authorAccountId: 'user1',
        })
      ).rejects.toThrow('Failed to add Tempo worklog: 400 Bad Request - Invalid data');
    });
  });

  describe('deleteWorklog', () => {
    it('should delete a worklog successfully', async () => {
      (fetch as any).mockResolvedValueOnce({ ok: true });
      await expect(client.deleteWorklog('12345')).resolves.toBe(true);
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Not found'),
      });
      await expect(client.deleteWorklog('99999')).rejects.toThrow(
        'Failed to delete Tempo worklog: 404 Not Found - Not found'
      );
    });
  });
}); 