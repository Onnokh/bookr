import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import envPaths from 'env-paths';

interface CacheData {
  lastCheck: number;
  latestVersion: string;
  updateAvailable: boolean;
}

/**
 * Get cache file path for storing update check results
 */
export function getCachePath(): string {
  const paths = envPaths('bookr-cli', { suffix: '' });
  return join(paths.cache, 'update-cache.json');
}

/**
 * Read cached update information
 */
export function readCache(): CacheData | null {
  try {
    const cachePath = getCachePath();
    if (!existsSync(cachePath)) {
      return null;
    }

    const cacheContent = readFileSync(cachePath, 'utf-8');
    return JSON.parse(cacheContent) as CacheData;
  } catch {
    return null;
  }
}

/**
 * Write update information to cache
 */
export function writeCache(data: CacheData): void {
  try {
    const cachePath = getCachePath();
    const cacheDir = dirname(cachePath);

    // Ensure cache directory exists
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }

    writeFileSync(cachePath, JSON.stringify(data, null, 2));
  } catch {
    // Silently fail cache writes
  }
}

export const getCache = readCache;
export const setCache = writeCache;
export function clearCache() {
  try {
    const cachePath = getCachePath();
    if (existsSync(cachePath)) {
      unlinkSync(cachePath);
    }
  } catch {
    // Silently fail
  }
}

export type { CacheData };
