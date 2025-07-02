import { describe, expect, it } from 'vitest';
import { checkForUpdates, forceCheckForUpdates } from '../../src/utils/update.js';

describe('Update Checker Integration', () => {
  it('should check for updates normally (using cache)', async () => {
    const updateInfo = await checkForUpdates();

    expect(updateInfo).toHaveProperty('current');
    expect(updateInfo).toHaveProperty('latest');
    expect(updateInfo).toHaveProperty('hasUpdate');
    expect(updateInfo).toHaveProperty('isOutdated');

    expect(typeof updateInfo.current).toBe('string');
    expect(typeof updateInfo.latest).toBe('string');
    expect(typeof updateInfo.hasUpdate).toBe('boolean');
    expect(typeof updateInfo.isOutdated).toBe('boolean');

    console.log('📦 Update check results:');
    console.log(`   Current version: ${updateInfo.current}`);
    console.log(`   Latest version: ${updateInfo.latest}`);
    console.log(`   Has update: ${updateInfo.hasUpdate}`);
    console.log(`   Is outdated: ${updateInfo.isOutdated}`);
  });

  it('should force check for updates (ignoring cache)', async () => {
    const forceUpdateInfo = await forceCheckForUpdates();

    expect(forceUpdateInfo).toHaveProperty('current');
    expect(forceUpdateInfo).toHaveProperty('latest');
    expect(forceUpdateInfo).toHaveProperty('hasUpdate');
    expect(forceUpdateInfo).toHaveProperty('isOutdated');

    expect(typeof forceUpdateInfo.current).toBe('string');
    expect(typeof forceUpdateInfo.latest).toBe('string');
    expect(typeof forceUpdateInfo.hasUpdate).toBe('boolean');
    expect(typeof forceUpdateInfo.isOutdated).toBe('boolean');

    console.log('📦 Force update check results:');
    console.log(`   Current version: ${forceUpdateInfo.current}`);
    console.log(`   Latest version: ${forceUpdateInfo.latest}`);
    console.log(`   Has update: ${forceUpdateInfo.hasUpdate}`);
    console.log(`   Is outdated: ${forceUpdateInfo.isOutdated}`);
  });

  it('should provide consistent version information', async () => {
    const normalCheck = await checkForUpdates();
    const forceCheck = await forceCheckForUpdates();

    // Both checks should return the same current version
    expect(normalCheck.current).toBe(forceCheck.current);

    // Both should have the same structure
    expect(Object.keys(normalCheck)).toEqual(Object.keys(forceCheck));

    // Version strings should be valid semver format
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    expect(normalCheck.current).toMatch(semverRegex);
    expect(normalCheck.latest).toMatch(semverRegex);
    expect(forceCheck.latest).toMatch(semverRegex);
  });

  it('should handle update status correctly', async () => {
    const updateInfo = await checkForUpdates();

    if (updateInfo.hasUpdate) {
      console.log('📦 Update available!');
      console.log('   Run: npm update -g bookr-cli');
      expect(updateInfo.current).not.toBe(updateInfo.latest);
    } else {
      console.log('✅ You are running the latest version!');
      // When no update is available, current version should be >= latest version
      // This handles cases where current version is newer than what's published on npm
      const currentParts = updateInfo.current.split('.').map(Number);
      const latestParts = updateInfo.latest.split('.').map(Number);

      // Compare versions: current should be >= latest when no update is available
      const isCurrentNewerOrEqual =
        currentParts[0] > latestParts[0] ||
        (currentParts[0] === latestParts[0] && currentParts[1] > latestParts[1]) ||
        (currentParts[0] === latestParts[0] &&
          currentParts[1] === latestParts[1] &&
          currentParts[2] >= latestParts[2]);

      expect(isCurrentNewerOrEqual).toBe(true);
    }

    // hasUpdate and isOutdated should be consistent
    if (updateInfo.hasUpdate) {
      expect(updateInfo.isOutdated).toBe(true);
    } else {
      expect(updateInfo.isOutdated).toBe(false);
    }
  });
});
