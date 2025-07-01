import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCache, writeCache } from './cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface UpdateInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  isOutdated: boolean;
}

interface PackageJson {
  name: string;
  version: string;
}

interface NpmRegistryResponse {
  version: string;
}

/**
 * Get package information from package.json
 */
function getPackageInfo(): PackageJson {
  try {
    const packagePath = join(__dirname, '..', '..', 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    return JSON.parse(packageContent);
  } catch {
    return { name: 'bookr-cli', version: '0.0.0' };
  }
}

/**
 * Compare two semantic versions
 */
function compareVersions(current: string, latest: string): boolean {
  const currentParts = current.split('.').map((part) => Number(part) || 0);
  const latestParts = latest.split('.').map((part) => Number(part) || 0);

  // Compare major version
  if ((latestParts[0] ?? 0) > (currentParts[0] ?? 0)) return true;
  if ((latestParts[0] ?? 0) < (currentParts[0] ?? 0)) return false;

  // Compare minor version
  if ((latestParts[1] ?? 0) > (currentParts[1] ?? 0)) return true;
  if ((latestParts[1] ?? 0) < (currentParts[1] ?? 0)) return false;

  // Compare patch version
  return (latestParts[2] ?? 0) > (currentParts[2] ?? 0);
}

/**
 * Check if we should perform an update check
 * Only check once per day to avoid excessive API calls
 */
function shouldCheckForUpdates(): boolean {
  const cache = readCache();
  if (!cache) return true;

  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const timeSinceLastCheck = Date.now() - cache.lastCheck;

  return timeSinceLastCheck > oneDay;
}

/**
 * Fetch latest version from npm registry
 */
async function fetchLatestVersion(packageName: string): Promise<string> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as NpmRegistryResponse;
    return data.version;
  } catch (error) {
    throw new Error(
      `Failed to fetch latest version: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check for available updates
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  const packageInfo = getPackageInfo();
  const currentVersion = packageInfo.version;

  // Check cache first
  if (!shouldCheckForUpdates()) {
    const cache = readCache();
    if (cache) {
      return {
        current: currentVersion,
        latest: cache.latestVersion,
        hasUpdate: cache.updateAvailable,
        isOutdated: cache.updateAvailable,
      };
    }
  }

  try {
    const latestVersion = await fetchLatestVersion(packageInfo.name);
    const hasUpdate = compareVersions(currentVersion, latestVersion);

    // Cache the result
    writeCache({
      lastCheck: Date.now(),
      latestVersion,
      updateAvailable: hasUpdate,
    });

    return {
      current: currentVersion,
      latest: latestVersion,
      hasUpdate,
      isOutdated: hasUpdate,
    };
  } catch {
    // If fetch fails, return current version info
    return {
      current: currentVersion,
      latest: currentVersion,
      hasUpdate: false,
      isOutdated: false,
    };
  }
}

/**
 * Get update notification message
 */
export function getUpdateMessage(updateInfo: UpdateInfo): string {
  if (!updateInfo.hasUpdate) return '';

  const { current, latest } = updateInfo;

  return `📦 Update available: ${current} → ${latest}\nRun: npm update -g bookr-cli`;
}

/**
 * Display update notification if available
 */
export async function showUpdateNotification(): Promise<void> {
  try {
    const updateInfo = await checkForUpdates();
    const message = getUpdateMessage(updateInfo);

    if (message) {
      console.log(`\n${message}\n`);
    }
  } catch {
    // Silently fail update notifications
  }
}

/**
 * Force check for updates (ignores cache)
 */
export async function forceCheckForUpdates(): Promise<UpdateInfo> {
  const packageInfo = getPackageInfo();
  const currentVersion = packageInfo.version;

  try {
    const latestVersion = await fetchLatestVersion(packageInfo.name);
    const hasUpdate = compareVersions(currentVersion, latestVersion);

    // Update cache
    writeCache({
      lastCheck: Date.now(),
      latestVersion,
      updateAvailable: hasUpdate,
    });

    return {
      current: currentVersion,
      latest: latestVersion,
      hasUpdate,
      isOutdated: hasUpdate,
    };
  } catch (error) {
    throw new Error(
      `Failed to check for updates: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
