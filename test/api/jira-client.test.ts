import { JiraClient } from '@/api/jira-client';
import type { JiraAuth, JiraIssue, JiraUser, JiraWorklog } from '@/types/jira';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn() as any;

// Mock config module
vi.mock('@/utils/config', () => ({
  loadConfigFromFile: vi.fn(),
}));

describe('JiraClient', () => {
  let client: JiraClient;
  let mockAuth: JiraAuth;

  beforeEach(() => {
    mockAuth = {
      baseUrl: 'https://example.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
    };
    client = new JiraClient(mockAuth);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getIssue', () => {
    it('should fetch issue successfully', async () => {
      const mockIssue: JiraIssue = {
        id: '123',
        key: 'PROJ-123',
        fields: {
          summary: 'Test Issue',
          description: 'Test Description',
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIssue),
      });

      const result = await client.getIssue('PROJ-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://example.atlassian.net/rest/api/3/issue/PROJ-123',
        {
          method: 'GET',
          headers: {
            Authorization: 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'bookr-cli/1.0',
          },
        }
      );
      expect(result).toEqual(mockIssue);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        errorMessages: ['Issue not found'],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: () => Promise.resolve(errorResponse),
      });

      await expect(client.getIssue('INVALID-123')).rejects.toThrow(
        'Failed to get issue: Issue not found'
      );
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getIssue('PROJ-123')).rejects.toThrow(
        'Error fetching issue PROJ-123: Network error'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser: JiraUser = {
        accountId: 'user123',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await client.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith('https://example.atlassian.net/rest/api/3/myself', {
        method: 'GET',
        headers: {
          Authorization: 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'bookr-cli/1.0',
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockUser: JiraUser = {
        accountId: 'user123',
        displayName: 'Test User',
        emailAddress: 'test@example.com',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });
});
