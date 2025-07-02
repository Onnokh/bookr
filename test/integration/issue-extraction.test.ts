import { describe, expect, it } from 'vitest';
import { getTicketFromBranch } from '../../src/utils/git.js';

describe('Issue Extraction Integration', () => {
  it('should extract JIRA issue keys from various branch formats', () => {
    const testCases = [
      {
        branch: 'feature/SUM25-176/course-information-import',
        expected: 'SUM25-176',
        description: 'Feature branch with issue key',
      },
      {
        branch: 'feature/TEMP-123-add-cli-tool',
        expected: 'TEMP-123',
        description: 'Feature branch with issue key and description',
      },
      {
        branch: 'bugfix/PROJ-456/fix-login',
        expected: 'PROJ-456',
        description: 'Bugfix branch with issue key',
      },
      {
        branch: 'feature/WILLEMII-62-test-integration',
        expected: 'WILLEMII-62',
        description: 'Feature branch with issue key',
      },
      {
        branch: 'TEMP-789-update-docs',
        expected: 'TEMP-789',
        description: 'Direct issue key prefix',
      },
      {
        branch: 'main',
        expected: null,
        description: 'Main branch (no issue key)',
      },
      {
        branch: 'develop',
        expected: null,
        description: 'Develop branch (no issue key)',
      },
      {
        branch: 'hotfix/urgent-fix',
        expected: null,
        description: 'Hotfix without issue key',
      },
      {
        branch: 'feature/ABC-123-DEF-456/dual-issues',
        expected: 'ABC-123',
        description: 'Multiple issue keys (should get first)',
      },
      {
        branch: 'release/v1.2.3',
        expected: null,
        description: 'Release branch (no issue key)',
      },
    ];

    console.log('🧪 Testing JIRA issue key extraction:\n');

    for (const { branch, expected, description } of testCases) {
      const result = getTicketFromBranch(branch);

      console.log(`Branch: ${branch}`);
      console.log(`Expected: ${expected || 'None'}`);
      console.log(`Result: ${result || 'None'}`);
      console.log(`Description: ${description}`);
      console.log(`Status: ${result === expected ? '✅ PASS' : '❌ FAIL'}`);
      console.log('---');

      expect(result).toBe(expected);
    }
  });

  it('should handle edge cases correctly', () => {
    const edgeCases = [
      {
        branch: '',
        expected: null,
        description: 'Empty string',
      },
      {
        branch: 'ABC-123',
        expected: 'ABC-123',
        description: 'Just issue key',
      },
      {
        branch: 'abc-123',
        expected: 'ABC-123',
        description: 'Lowercase issue key',
      },
      {
        branch: 'feature/ABC-123/',
        expected: 'ABC-123',
        description: 'Trailing slash',
      },
      {
        branch: '/feature/ABC-123',
        expected: 'ABC-123',
        description: 'Leading slash',
      },
      {
        branch: 'feature/ABC-123-extra-dashes',
        expected: 'ABC-123',
        description: 'Extra dashes after issue key',
      },
    ];

    console.log('🧪 Testing edge cases:\n');

    for (const { branch, expected, description } of edgeCases) {
      const result = getTicketFromBranch(branch);

      console.log(`Branch: "${branch}"`);
      console.log(`Expected: ${expected || 'None'}`);
      console.log(`Result: ${result || 'None'}`);
      console.log(`Description: ${description}`);
      console.log(`Status: ${result === expected ? '✅ PASS' : '❌ FAIL'}`);
      console.log('---');

      expect(result).toBe(expected);
    }
  });

  it('should handle various project key formats', () => {
    const projectKeyTests = [
      { branch: 'feature/PROJ-123/test', expected: 'PROJ-123' },
      { branch: 'feature/ABC-456/test', expected: 'ABC-456' },
      { branch: 'feature/XYZ-789/test', expected: 'XYZ-789' },
      { branch: 'feature/123-456/test', expected: '123-456' }, // Numeric project key
      { branch: 'feature/A-123/test', expected: 'A-123' }, // Single letter project
      { branch: 'feature/ABCDEF-123/test', expected: 'ABCDEF-123' }, // Long project key
    ];

    console.log('🧪 Testing various project key formats:\n');

    for (const { branch, expected } of projectKeyTests) {
      const result = getTicketFromBranch(branch);

      console.log(`Branch: ${branch}`);
      console.log(`Expected: ${expected}`);
      console.log(`Result: ${result || 'None'}`);
      console.log(`Status: ${result === expected ? '✅ PASS' : '❌ FAIL'}`);
      console.log('---');

      expect(result).toBe(expected);
    }
  });
});
