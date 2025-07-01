import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import envPaths from 'env-paths';
import type { JiraIssue, JiraWorklog } from '../types/jira.js';

export interface StoredWorklog {
  id: string; // Jira worklog ID
  issueKey: string;
  issueId: string;
  issueSummary: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment?: string;
  started: string;
  createdAt: string; // When it was created via bookr
  author: {
    name: string;
    displayName: string;
  };
}

interface WorklogStorageData {
  worklogs: StoredWorklog[];
  lastCleanup: string;
}

/**
 * Get worklog storage file path
 */
export function getWorklogStoragePath(): string {
  const paths = envPaths('bookr-cli', { suffix: '' });
  return join(paths.data, 'worklogs.json');
}

/**
 * Read stored worklogs
 */
export function readStoredWorklogs(): WorklogStorageData {
  try {
    const storagePath = getWorklogStoragePath();
    if (!existsSync(storagePath)) {
      return { worklogs: [], lastCleanup: new Date().toISOString() };
    }

    const content = readFileSync(storagePath, 'utf-8');
    const data = JSON.parse(content) as WorklogStorageData;
    
    // Ensure we have the expected structure
    if (!data.worklogs || !Array.isArray(data.worklogs)) {
      return { worklogs: [], lastCleanup: new Date().toISOString() };
    }
    
    return data;
  } catch {
    return { worklogs: [], lastCleanup: new Date().toISOString() };
  }
}

/**
 * Write stored worklogs
 */
export function writeStoredWorklogs(data: WorklogStorageData): void {
  try {
    const storagePath = getWorklogStoragePath();
    const storageDir = dirname(storagePath);

    // Ensure storage directory exists
    if (!existsSync(storageDir)) {
      mkdirSync(storageDir, { recursive: true });
    }

    writeFileSync(storagePath, JSON.stringify(data, null, 2));
  } catch {
    // Silently fail storage writes
  }
}

/**
 * Store a worklog after creation
 */
export function storeWorklog(
  issue: JiraIssue,
  worklog: JiraWorklog,
  originalComment?: string
): boolean {
  try {
    if (!worklog.id || !worklog.author) {
      return false;
    }

    const data = readStoredWorklogs();
    
    const storedWorklog: StoredWorklog = {
      id: worklog.id,
      issueKey: issue.key,
      issueId: issue.id,
      issueSummary: issue.fields.summary,
      timeSpent: worklog.timeSpent,
      timeSpentSeconds: worklog.timeSpentSeconds || 0,
      comment: originalComment || undefined,
      started: worklog.started || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      author: worklog.author,
    };

    // Add to the beginning of the array (most recent first)
    data.worklogs.unshift(storedWorklog);
    
    // Keep only the last 100 worklogs to prevent unlimited growth
    if (data.worklogs.length > 100) {
      data.worklogs = data.worklogs.slice(0, 100);
    }

    writeStoredWorklogs(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get worklog by ID
 */
export function getStoredWorklogById(worklogId: string): StoredWorklog | null {
  const data = readStoredWorklogs();
  return data.worklogs.find(w => w.id === worklogId) || null;
}

/**
 * Remove worklog from storage after deletion
 */
export function removeStoredWorklog(worklogId: string): boolean {
  try {
    const data = readStoredWorklogs();
    const originalLength = data.worklogs.length;
    data.worklogs = data.worklogs.filter(w => w.id !== worklogId);
    
    if (data.worklogs.length < originalLength) {
      writeStoredWorklogs(data);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Get today's stored worklogs
 */
export function getTodaysStoredWorklogs(): StoredWorklog[] {
  const data = readStoredWorklogs();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return data.worklogs.filter(worklog => {
    const worklogDate = new Date(worklog.started);
    return worklogDate >= startOfDay && worklogDate <= endOfDay;
  });
}

/**
 * Get recent stored worklogs (last 10 days)
 */
export function getRecentStoredWorklogs(days = 10): StoredWorklog[] {
  const data = readStoredWorklogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return data.worklogs.filter(worklog => {
    const worklogDate = new Date(worklog.started);
    return worklogDate >= cutoffDate;
  });
}

/**
 * Clean up old worklogs (older than 30 days)
 */
export function cleanupOldWorklogs(): number {
  try {
    const data = readStoredWorklogs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const originalLength = data.worklogs.length;
    data.worklogs = data.worklogs.filter(worklog => {
      const worklogDate = new Date(worklog.createdAt);
      return worklogDate >= cutoffDate;
    });

    const removedCount = originalLength - data.worklogs.length;
    
    if (removedCount > 0) {
      data.lastCleanup = new Date().toISOString();
      writeStoredWorklogs(data);
    }

    return removedCount;
  } catch {
    return 0;
  }
}