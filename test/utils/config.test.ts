import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadConfigFromFile, saveConfigToFile } from '@/utils/config.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('env-paths', () => ({
  default: () => ({ config: '/mock' }),
}));
vi.mock('node:fs');
vi.mock('node:path');

describe('Config Utils', () => {
  const mockConfigPath = '/mock/config.json';
  const mockConfig = {
    baseUrl: 'https://example.atlassian.net',
    email: 'test@example.com',
    apiToken: 'token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadConfigFromFile', () => {
    it('should load config from file', () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(
        JSON.stringify({
          JIRA_BASE_URL: mockConfig.baseUrl,
          JIRA_EMAIL: mockConfig.email,
          JIRA_API_TOKEN: mockConfig.apiToken,
        })
      );
      (path.join as any).mockReturnValue(mockConfigPath);

      const config = loadConfigFromFile();
      expect(config).toEqual(mockConfig);
    });

    it('should return null if file does not exist', () => {
      (fs.existsSync as any).mockReturnValue(false);
      (path.join as any).mockReturnValue(mockConfigPath);

      const config = loadConfigFromFile();
      expect(config).toBeNull();
    });
  });

  describe('saveConfigToFile', () => {
    it('should save config to file', () => {
      (path.join as any).mockReturnValue(mockConfigPath);
      (fs.writeFileSync as any).mockImplementation(() => {});

      expect(() => saveConfigToFile(mockConfig)).not.toThrow();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(mockConfig, null, 2)
      );
    });
  });
});
