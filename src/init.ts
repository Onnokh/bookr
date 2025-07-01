#!/usr/bin/env node

import inquirer from 'inquirer';
import envPaths from 'env-paths';
import fs from 'fs';
import path from 'path';

const paths = envPaths('bookr');
const configDir = paths.config;
const configFile = path.join(configDir, 'config.json');

async function promptForConfig() {
  const questions = [
    {
      type: 'input',
      name: 'JIRA_BASE_URL',
      message: 'JIRA Base URL (e.g. https://your-domain.atlassian.net):',
      validate: (input: string) => input.startsWith('http') || 'Please enter a valid URL.'
    },
    {
      type: 'input',
      name: 'JIRA_EMAIL',
      message: 'JIRA Email:',
      validate: (input: string) => input.includes('@') || 'Please enter a valid email.'
    },
    {
      type: 'password',
      name: 'JIRA_API_TOKEN',
      message: 'JIRA API Token:',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'API token cannot be empty.'
    }
  ];
  return await inquirer.prompt(questions as any);
}

async function saveConfig(config: Record<string, string>) {
  await fs.promises.mkdir(configDir, { recursive: true });
  await fs.promises.writeFile(configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
}

async function main() {
  console.log('🔧 Bookr Init: Set up your JIRA credentials\n');
  const config = await promptForConfig();
  await saveConfig(config);
  console.log(`\n✅ Config saved to ${configFile}`);
}

main().catch(err => {
  console.error('❌ Error during init:', err);
  process.exit(1);
}); 