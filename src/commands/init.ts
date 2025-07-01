import fs from 'node:fs';
import path from 'node:path';
import envPaths from 'env-paths';
import inquirer from 'inquirer';

const paths = envPaths('bookr');
const configDir = paths.config;
const configFile = path.join(configDir, 'config.json');

async function promptForConfig() {
  const questions = [
    {
      type: 'input' as const,
      name: 'JIRA_BASE_URL',
      message: 'JIRA Base URL (e.g. https://your-domain.atlassian.net):',
      validate: (input: string) => input.startsWith('http') || 'Please enter a valid URL.',
    },
    {
      type: 'input' as const,
      name: 'JIRA_EMAIL',
      message: 'JIRA Email:',
      validate: (input: string) => input.includes('@') || 'Please enter a valid email.',
    },
    {
      type: 'password' as const,
      name: 'JIRA_API_TOKEN',
      message: 'JIRA API Token (from https://id.atlassian.com/manage-profile/security/api-tokens):',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'API token cannot be empty.',
    },
    {
      type: 'password' as const,
      name: 'TEMPO_API_TOKEN',
      message: 'Tempo API Token (from https://id.tempo.io/manage/api-tokens) [optional]:',
      mask: '*',
      validate: (_input: string) => true, // Optional
    },
  ];
  return await inquirer.prompt(questions);
}

async function saveConfig(config: Record<string, string>) {
  await fs.promises.mkdir(configDir, { recursive: true });
  await fs.promises.writeFile(configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export async function init() {
  console.log('🔧 Bookr Init: Set up your JIRA credentials\n');
  const config = await promptForConfig();
  await saveConfig(config);
  console.log(`\n✅ Config saved to ${configFile}`);
}

// Default export for CLI usage
export default init;

// For backward compatibility when running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  init().catch((err) => {
    console.error('❌ Error during init:', err);
    process.exit(1);
  });
}
