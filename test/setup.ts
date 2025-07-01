import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env['NODE_ENV'] = 'test';

  // Mock console methods to avoid noise in tests
  global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };
});

// Global test cleanup
afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup any global state
});
