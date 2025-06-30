import { execSync } from 'child_process';
/**
 * Get the current Git branch name
 */
export function getCurrentBranch() {
    try {
        // Try the modern Git command first
        return execSync('git branch --show-current', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
    }
    catch (error) {
        try {
            // Fallback to older Git command
            return execSync('git rev-parse --abbrev-ref HEAD', {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            }).trim();
        }
        catch (secondError) {
            // Final fallback to environment variable
            return process.env['GIT_BRANCH'] || 'unknown';
        }
    }
}
/**
 * Check if we're in a Git repository
 */
export function isGitRepository() {
    try {
        execSync('git rev-parse --git-dir', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Extract JIRA issue key from a branch name
 */
export function extractJiraIssueKey(branchName) {
    // Common patterns for JIRA issue keys in branch names
    // Support both uppercase and lowercase project keys
    const patterns = [
        /(?:feature|bugfix|hotfix|release)\/([A-Za-z]+-\d+)/i,
        /([A-Za-z]+-\d+)/,
        /(?:issue|ticket)\/([A-Za-z]+-\d+)/i
    ];
    for (const pattern of patterns) {
        const match = branchName.match(pattern);
        if (match && match[1]) {
            return match[1].toUpperCase(); // Convert to uppercase for JIRA
        }
    }
    return null;
}
//# sourceMappingURL=git.js.map