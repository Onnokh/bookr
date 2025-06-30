import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function getPackageVersion() {
    try {
        const packagePath = join(__dirname, '..', '..', 'package.json');
        const packageContent = readFileSync(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);
        return packageJson.version;
    }
    catch (error) {
        console.error('Error reading package.json:', error);
        return '0.0.0';
    }
}
function getGitCommitHash() {
    try {
        const commitHash = execSync('git rev-parse --short HEAD', {
            encoding: 'utf-8',
            cwd: join(__dirname, '..', '..')
        }).trim();
        return commitHash;
    }
    catch (error) {
        // Git not available or not a git repository
        return null;
    }
}
function getGitBranch() {
    try {
        const branch = execSync('git branch --show-current', {
            encoding: 'utf-8',
            cwd: join(__dirname, '..', '..')
        }).trim();
        return branch;
    }
    catch (error) {
        // Git not available or not a git repository
        return null;
    }
}
function isDirty() {
    try {
        const status = execSync('git status --porcelain', {
            encoding: 'utf-8',
            cwd: join(__dirname, '..', '..')
        }).trim();
        return status.length > 0;
    }
    catch (error) {
        return false;
    }
}
export function getVersion() {
    const version = getPackageVersion();
    const commitHash = getGitCommitHash();
    const branch = getGitBranch();
    const dirty = isDirty();
    if (!commitHash) {
        return version;
    }
    let versionString = `${version}-${commitHash}`;
    if (branch && branch !== 'main' && branch !== 'master') {
        versionString += `-${branch}`;
    }
    if (dirty) {
        versionString += '-dirty';
    }
    return versionString;
}
export function getFullVersionInfo() {
    return {
        version: getPackageVersion(),
        commitHash: getGitCommitHash(),
        branch: getGitBranch(),
        dirty: isDirty()
    };
}
//# sourceMappingURL=version.js.map