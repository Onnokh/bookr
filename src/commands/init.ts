import fs from 'node:fs';
import path from 'node:path';
import envPaths from 'env-paths';
import inquirer from 'inquirer';
import { loadConfigFromFile } from '../utils/config.js';

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

async function promptForTempoToken() {
  const questions = [
    {
      type: 'password' as const,
      name: 'TEMPO_API_TOKEN',
      message: 'Tempo API Token (from https://id.tempo.io/manage/api-tokens):',
      mask: '*',
      validate: (input: string) => input.length > 0 || 'Tempo API token cannot be empty.',
    },
  ];
  return await inquirer.prompt(questions);
}

async function saveConfig(config: Record<string, string>) {
  await fs.promises.mkdir(configDir, { recursive: true });
  await fs.promises.writeFile(configFile, JSON.stringify(config, null, 2), { mode: 0o600 });
}


export async function init() {
  const existingConfig = loadConfigFromFile();
  
  if (existingConfig?.baseUrl && existingConfig?.email && existingConfig?.apiToken) {
    console.log('🔧 Bookr Init: Configuration already exists\n');
    
    // Ask if user wants to overwrite existing configuration
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Configuration already exists. Do you want to overwrite it?',
        default: false,
      },
    ]);
    
    if (!overwrite) {
      // Check if Tempo token is missing and offer to add it
      if (!existingConfig.tempoApiToken) {
        console.log('📝 Tempo API token is missing. Would you like to add it?');
        const { addTempo } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addTempo',
            message: 'Add Tempo API token to existing configuration?',
            default: true,
          },
        ]);
        
        if (addTempo) {
          console.log('🔧 Bookr: Add Tempo API Token to existing configuration\n');
          
          // Extract hostname from JIRA base URL to construct Tempo URL
          const jiraUrl = new URL(existingConfig.baseUrl);
          const tempoUrl = `https://${jiraUrl.hostname}/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/api-integration`;
          console.log(`🔧 ${tempoUrl}\n`);
          
          const tempoConfig = await promptForTempoToken();
          
          // Merge existing config with new Tempo token
          const updatedConfig: Record<string, string> = {
            JIRA_BASE_URL: existingConfig.baseUrl,
            JIRA_EMAIL: existingConfig.email,
            JIRA_API_TOKEN: existingConfig.apiToken,
            TEMPO_API_TOKEN: tempoConfig['TEMPO_API_TOKEN'],
          };
          
          await saveConfig(updatedConfig);
          console.log(`\n✅ Tempo API token added to configuration at ${configFile}`);
          return;
        }
      }
      
      console.log('✅ Configuration is already complete. No changes needed.');
      return;
    }
    
    // User chose to overwrite, continue with full setup
    console.log('🔧 Overwriting existing configuration...\n');
  }
  
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
