#!/usr/bin/env node

import { extractJiraIssueKey } from './utils/git.js';

function testIssueExtraction() {
  const testBranches = [
    'feature/SUM25-176/course-information-import',
    'feature/TEMP-123-add-cli-tool',
    'bugfix/PROJ-456/fix-login',
    'feature/WILLEMII-62-test-integration',
    'TEMP-789-update-docs',
    'main',
    'develop',
  ];

  console.log('🧪 Testing JIRA issue key extraction:\n');

  for (const branch of testBranches) {
    const issueKey = extractJiraIssueKey(branch);
    console.log(`Branch: ${branch}`);
    console.log(`Issue Key: ${issueKey || 'None found'}`);
    console.log('---');
  }
}

testIssueExtraction();
