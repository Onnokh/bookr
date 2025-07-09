import { loadConfigFromFile } from '../utils/config.js';

async function main() {
  const config = loadConfigFromFile();
  if (!config?.tempoApiToken) {
    console.error('❌ No TEMPO_API_TOKEN found in config.');
    process.exit(1);
  }
  if (!config?.email) {
    console.error('❌ No JIRA_EMAIL found in config (used for account lookup).');
    process.exit(1);
  }

  // You may need to hardcode or fetch your accountId here. For now, prompt the user to enter it.
  const accountId = process.argv[2];
  if (!accountId) {
    console.error('Usage: node src/api/test-tempo-workload.js <accountId>');
    process.exit(1);
  }

  const baseUrl = 'https://api.tempo.io/4';
  const url = `${baseUrl}/workload-schemes/users/${encodeURIComponent(accountId)}`;
  console.log(`\n🔍 Testing Tempo Workload API for accountId: ${accountId}`);
  console.log(`GET ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.tempoApiToken}`,
        'Accept': 'application/json',
      },
    });
    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch {
      console.log('Response Text:', text);
    }
  } catch (err) {
    console.error('❌ Error during fetch:', err);
  }
}

main(); 