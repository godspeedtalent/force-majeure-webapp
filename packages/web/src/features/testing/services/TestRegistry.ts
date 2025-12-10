import { logger } from '@force-majeure/shared';
import { TestSuite } from '../types/testing';

class TestRegistryService {
  private suites: Map<string, TestSuite> = new Map();

  register(suite: TestSuite) {
    if (this.suites.has(suite.id)) {
      logger.warn(
        `Test suite with id "${suite.id}" is already registered. Overwriting.`
      );
    }
    this.suites.set(suite.id, suite);
  }

  get(suiteId: string): TestSuite | undefined {
    return this.suites.get(suiteId);
  }

  getAll(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  unregister(suiteId: string): boolean {
    return this.suites.delete(suiteId);
  }

  clear() {
    this.suites.clear();
  }

  validate(suite: TestSuite): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!suite.id) {
      errors.push('Test suite must have an id');
    }

    if (!suite.name) {
      errors.push('Test suite must have a name');
    }

    if (!suite.testCases || suite.testCases.length === 0) {
      errors.push('Test suite must have at least one test case');
    }

    suite.testCases?.forEach((testCase, index) => {
      if (!testCase.id) {
        errors.push(`Test case at index ${index} must have an id`);
      }
      if (!testCase.name) {
        errors.push(`Test case at index ${index} must have a name`);
      }
      if (typeof testCase.execute !== 'function') {
        errors.push(
          `Test case "${testCase.name}" must have an execute function`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const TestRegistry = new TestRegistryService();
