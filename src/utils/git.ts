import { execSync } from 'node:child_process';

/**
 * Get the current Git branch name
 */
export function getCurrentBranch(): string {
  try {
    // Try the modern Git command first
    return execSync('git branch --show-current', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (_error) {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  }
}

/**
 * Check if we're in a Git repository
 */
export function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Extract JIRA issue key from a branch name
 */
export function extractJiraIssueKey(branchName: string): string | null {
  // Common patterns for JIRA issue keys in branch names
  // Support both uppercase and lowercase project keys
  // Handle additional path segments after the issue key
  // Project keys can contain numbers (e.g., SUM25, OCI2025P, WILLEMII)
  const patterns = [
    /(?:feature|bugfix|hotfix|release)\/([A-Za-z0-9]+-\d+)(?:\/.*)?/i,
    /([A-Za-z0-9]+-\d+)(?:\/.*)?/,
    /(?:issue|ticket)\/([A-Za-z0-9]+-\d+)(?:\/.*)?/i,
  ];

  for (const pattern of patterns) {
    const match = branchName.match(pattern);
    if (match?.[1]) {
      return match[1].toUpperCase(); // Convert to uppercase for JIRA
    }
  }

  return null;
}
