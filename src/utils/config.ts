import fs from 'node:fs';
import path from 'node:path';
import envPaths from 'env-paths';
import type { JiraAuth } from '../types/jira.js';

export interface BookrConfig extends JiraAuth {
  tempoApiToken?: string;
}

/**
 * Load JIRA and Tempo configuration from config file
 */
export function loadConfigFromFile(): Partial<BookrConfig> | null {
  try {
    const configFile = path.join(envPaths('bookr').config, 'config.json');
    if (fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        baseUrl: parsed.JIRA_BASE_URL,
        email: parsed.JIRA_EMAIL,
        apiToken: parsed.JIRA_API_TOKEN,
        tempoApiToken: parsed.TEMPO_API_TOKEN,
      };
    }
    return null;
  } catch (_e) {
    return null;
  }
}

export function saveConfigToFile(config: {
  JIRA_BASE_URL: string;
  JIRA_EMAIL: string;
  JIRA_API_TOKEN: string;
  TEMPO_API_TOKEN?: string;
  TEMPO_BASE_URL?: string;
}): void {
  const configFile = path.join(envPaths('bookr').config, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}
