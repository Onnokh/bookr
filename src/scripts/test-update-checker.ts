#!/usr/bin/env node

import { checkForUpdates, forceCheckForUpdates } from '../utils/update.js';

async function testUpdateChecker() {
  console.log('🧪 Testing update checker...\n');

  try {
    // Test normal check (uses cache if available)
    console.log('1. Testing normal update check...');
    const updateInfo = await checkForUpdates();
    console.log(`Current version: ${updateInfo.current}`);
    console.log(`Latest version: ${updateInfo.latest}`);
    console.log(`Has update: ${updateInfo.hasUpdate}`);
    console.log(`Is outdated: ${updateInfo.isOutdated}\n`);

    // Test force check (ignores cache)
    console.log('2. Testing force update check...');
    const forceUpdateInfo = await forceCheckForUpdates();
    console.log(`Current version: ${forceUpdateInfo.current}`);
    console.log(`Latest version: ${forceUpdateInfo.latest}`);
    console.log(`Has update: ${forceUpdateInfo.hasUpdate}`);
    console.log(`Is outdated: ${forceUpdateInfo.isOutdated}\n`);

    if (updateInfo.hasUpdate) {
      console.log('📦 Update available!');
      console.log('Run: npm update -g bookr-cli');
    } else {
      console.log('✅ You are running the latest version!');
    }
  } catch (error) {
    console.error(
      '❌ Error testing update checker:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

testUpdateChecker().catch(console.error);
