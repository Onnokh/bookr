import { getTicketFromBranch } from '@/utils/git.js';
import { describe, expect, it } from 'vitest';

describe('Git Utils - Pure Functions', () => {
  describe('getTicketFromBranch', () => {
    it('should extract ticket from feature branch', () => {
      const result = getTicketFromBranch('feature/PROJ-123-add-testing');
      expect(result).toBe('PROJ-123');
    });

    it('should extract ticket from bugfix branch', () => {
      const result = getTicketFromBranch('bugfix/PROJ-456-fix-issue');
      expect(result).toBe('PROJ-456');
    });

    it('should extract ticket from hotfix branch', () => {
      const result = getTicketFromBranch('hotfix/PROJ-789-critical-fix');
      expect(result).toBe('PROJ-789');
    });

    it('should extract ticket from branch with multiple dashes', () => {
      const result = getTicketFromBranch('feature/PROJ-123-add-new-feature');
      expect(result).toBe('PROJ-123');
    });

    it('should return null for branches without ticket pattern', () => {
      const result = getTicketFromBranch('main');
      expect(result).toBeNull();
    });

    it('should return null for branches with invalid ticket format', () => {
      const result = getTicketFromBranch('feature/invalid-ticket-format');
      expect(result).toBeNull();
    });

    it('should handle empty branch name', () => {
      const result = getTicketFromBranch('');
      expect(result).toBeNull();
    });

    it('should handle branch name with only ticket', () => {
      const result = getTicketFromBranch('PROJ-123');
      expect(result).toBe('PROJ-123');
    });

    it('should handle branch name with underscore separator', () => {
      const result = getTicketFromBranch('feature/PROJ_123_add_feature');
      expect(result).toBeNull();
    });
  });
});
