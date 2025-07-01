import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PackageJson {
  version: string;
  name: string;
}

function getPackageVersion(): string {
  try {
    const packagePath = join(__dirname, '..', '..', 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    const packageJson: PackageJson = JSON.parse(packageContent);
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package.json:', error);
    return '0.0.0';
  }
}

function getGitCommitHash(): string | null {
  try {
    const cwd = join(__dirname, '..', '..');
    const commitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      cwd,
    }).trim();
    return commitHash;
  } catch (_error) {
    return null;
  }
}

function getGitBranch(): string | null {
  try {
    const cwd = join(__dirname, '..', '..');
    const branch = execSync('git branch --show-current', {
      encoding: 'utf-8',
      cwd,
    }).trim();
    return branch;
  } catch (_error) {
    return null;
  }
}

function isDirty(): boolean {
  try {
    const cwd = join(__dirname, '..', '..');
    const status = execSync('git status --porcelain', {
      encoding: 'utf-8',
      cwd,
    }).trim();
    return status.length > 0;
  } catch (_error) {
    return false;
  }
}

export function getVersion(): string {
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

export function getFullVersionInfo(): {
  version: string;
  commitHash: string | null;
  branch: string | null;
  dirty: boolean;
} {
  return {
    version: getPackageVersion(),
    commitHash: getGitCommitHash(),
    branch: getGitBranch(),
    dirty: isDirty(),
  };
}
