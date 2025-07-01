import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readCache, writeCache, clearCache } from '@/utils/cache.js';

vi.mock('env-paths', () => ({
  default: () => ({ cache: '/mock' }),
}));
vi.mock('node:fs');
vi.mock('node:path');

describe('Cache Utils', () => {
  const mockCachePath = '/mock/update-cache.json';
  const mockCache = { 
    lastCheck: Date.now(),
    latestVersion: '1.0.0',
    updateAvailable: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('readCache', () => {
    it('should get cache from file', () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(JSON.stringify(mockCache));
      (path.join as any).mockReturnValue(mockCachePath);

      const cache = readCache();
      expect(cache).toEqual(mockCache);
    });

    it('should return null if file does not exist', () => {
      (fs.existsSync as any).mockReturnValue(false);
      (path.join as any).mockReturnValue(mockCachePath);

      const cache = readCache();
      expect(cache).toBeNull();
    });
  });

  describe('writeCache', () => {
    it('should set cache to file', () => {
      (path.join as any).mockReturnValue(mockCachePath);
      (fs.existsSync as any).mockReturnValue(true);
      (fs.writeFileSync as any).mockImplementation(() => {});

      expect(() => writeCache(mockCache)).not.toThrow();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockCachePath,
        JSON.stringify(mockCache, null, 2)
      );
    });
  });

  describe('clearCache', () => {
    it('should clear cache file', () => {
      (path.join as any).mockReturnValue(mockCachePath);
      (fs.existsSync as any).mockReturnValue(true);
      (fs.unlinkSync as any).mockImplementation(() => {});

      expect(() => clearCache()).not.toThrow();
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockCachePath);
    });
  });
});
