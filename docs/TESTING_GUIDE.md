# Testing Guide

## Overview

This project uses Vitest for unit and integration testing. The test suite was established in November 2025 with a "start small and expand" philosophy, beginning with pure utility functions and gradually moving toward more complex components.

## Test Infrastructure

### Testing Stack

- **Vitest**: Fast, Vite-native test runner with Jest-compatible API
- **@testing-library/react**: For testing React components
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: For simulating user interactions
- **jsdom/happy-dom**: DOM implementation for Node.js
- **@vitest/coverage-v8**: Code coverage reporting

### Configuration

- **Vitest config**: `config/vitest.config.ts`
- **Test setup**: `src/test/setup.ts` (global configuration, mocks, polyfills)
- **Coverage thresholds**: 80% across branches, functions, lines, and statements

## Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Structure

### File Organization

Tests are **colocated** with source files:

```
src/
├── shared/
│   ├── utils/
│   │   ├── utils.ts
│   │   ├── utils.test.ts          ✅ Tests colocated
│   │   ├── timeUtils.ts
│   │   └── timeUtils.test.ts      ✅ Tests colocated
│   └── hooks/
│       ├── useDebounce.ts
│       └── useDebounce.test.ts    ✅ Tests colocated
└── test/
    ├── setup.ts                   # Global test setup
    ├── utils/
    │   ├── testUtils.tsx          # Custom render with providers
    │   └── mockSupabase.ts        # Supabase mock factory
    └── fixtures/
        ├── events.ts              # Mock event data
        ├── users.ts               # Mock user data
        └── tickets.ts             # Mock ticket data
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Use descriptive `describe` blocks for grouping
- Use `it` for test cases (not `test`)

## Test Utilities

### Custom Render with Providers

For testing components that use React Query, Router, or other providers:

```typescript
import { renderWithProviders } from '@/test/utils/testUtils';

test('renders with providers', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Supabase Mocking

For testing code that uses Supabase:

```typescript
import { createMockSupabaseClient, createMockSupabaseQuery } from '@/test/utils/mockSupabase';

// Mock Supabase client
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

// Mock a successful query
const mockQuery = createMockSupabaseQuery({
  data: [{ id: 1, name: 'Test Event' }],
  error: null,
});
```

### Test Fixtures

Use fixture factories for consistent test data:

```typescript
import { createMockEvent } from '@/test/fixtures/events';
import { createMockUserProfile } from '@/test/fixtures/users';

const event = createMockEvent({ title: 'Custom Title' });
const user = createMockUserProfile({ role: 'admin' });
```

## Testing Patterns

### Pure Functions (Easiest)

Pure utility functions are the easiest to test - no mocking required:

```typescript
import { describe, it, expect } from 'vitest';
import { formatTimeDisplay } from './timeUtils';

describe('formatTimeDisplay', () => {
  it('converts 24-hour to 12-hour format', () => {
    expect(formatTimeDisplay(21)).toBe('9PM');
  });

  it('handles null input', () => {
    expect(formatTimeDisplay(null)).toBe('');
  });
});
```

### Custom Hooks

Use `renderHook` from React Testing Library:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'changed', delay: 500 });

    await waitFor(() => {
      expect(result.current).toBe('changed');
    });
  });
});
```

### React Components

Use `renderWithProviders` for components that need context:

```typescript
import { renderWithProviders, screen, userEvent } from '@/test/utils/testUtils';
import { MyButton } from './MyButton';

describe('MyButton', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    renderWithProviders(<MyButton onClick={handleClick}>Click me</MyButton>);

    const user = userEvent.setup();
    await user.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Current Test Coverage

### Tested Files (100% Coverage)

1. **`src/shared/utils/utils.ts`** (9 tests)
   - `cn()` className utility
   - Tailwind class merging
   - Conditional classes

2. **`src/shared/utils/timeUtils.ts`** (35 tests)
   - `formatTimeDisplay()` - 24h to 12h conversion
   - `parseTimeToMinutes()` - Time string parsing
   - Time ranges, edge cases

3. **`src/shared/utils/queueUtils.ts`** (36 tests)
   - `calculateEstimatedWaitTime()` - Queue wait time estimation
   - `formatWaitTime()` - Human-readable wait times
   - `getQueueProgressPercentage()` - Progress calculation
   - `formatQueuePosition()` - Ordinal formatting (1st, 2nd, 3rd)
   - `shouldNotifyPositionChange()` - Smart notification logic

4. **`src/shared/utils/styleUtils.ts`** (59 tests)
   - `getListItemClasses()` - Striped list items
   - `getInputClasses()` - Input field styling
   - `getLabelClasses()` - Label states (focused/unfocused)
   - `getDepthClasses()` - Depth/elevation layers (0-3)
   - `getButtonClasses()` - Button variants (primary, secondary, danger, info, outline)
   - `toSentenceCase()` - Text transformation
   - `formatHeader()` - Header formatting with periods
   - `getCardClasses()` - Card variants
   - `getIconButtonClasses()` - Icon button styling
   - `getSpacing()` - Design system spacing

5. **`src/shared/utils/formValidation.ts`** (80 tests)
   - Zod validation schemas (string, email, password, URL, phone, date, number, price)
   - `sanitizeInput()` - XSS protection
   - `encodeForUrl()` - URL encoding
   - `createFileValidation()` - File upload validation
   - Form schemas (contact, event, profile)
   - `passwordConfirmation()` - Password matching
   - `prepareFormData()` - Form data cleaning

6. **`src/shared/utils/environment.ts`** (21 tests)
   - `getEnvironment()` - Environment detection
   - `isDevelopment()` / `isProduction()` - Environment checks
   - `getFeatureFlagEnvironment()` - Feature flag environment mapping
   - `getEnvironmentOverride()` - Development overrides
   - `ENVIRONMENT_LABELS` - Display labels

7. **`src/shared/services/logger.ts`** (33 tests)
   - `Logger` class with namespace support
   - `debug()`, `info()`, `warn()`, `error()` methods
   - Console method mocking with `vi.spyOn()`
   - Development vs production logging behavior
   - Styled console output with emojis and colors
   - Context object logging

8. **`src/shared/hooks/useDebounce.ts`** (9 tests)
   - Debounced value updates with real timers
   - Timeout cancellation on rapid changes
   - Default 500ms delay
   - Custom delay handling
   - Delay changes
   - Different value types (number, boolean, object)
   - Null and undefined handling
   - Cleanup on unmount

9. **`src/shared/auth/permissions.ts`** (25 tests)
   - `PERMISSIONS` constants validation
   - `ROLES` constants validation
   - `ROLE_PERMISSIONS` mapping
   - Permission hierarchy (ADMIN > ORG_ADMIN > ORG_STAFF > USER)
   - Permission overlap (staff permissions are subset of admin)
   - TypeScript type validation

**Total: 307 tests passing, 99% overall coverage**

## Next Steps

### Phase 2: Constants & Config (Recommended Next)

Test these next for quick wins:

- `src/shared/constants/designSystem.ts` - Already has 100% coverage from imports
- `src/shared/config/featureFlags.ts` - Feature flag helpers
- ✅ ~~`src/shared/auth/permissions.ts`~~ - **COMPLETED**
- ✅ ~~`src/shared/utils/formValidation.ts`~~ - **COMPLETED**
- ✅ ~~`src/shared/utils/styleUtils.ts`~~ - **COMPLETED**
- ✅ ~~`src/shared/utils/environment.ts`~~ - **COMPLETED**

### Phase 3: Services (Partially Completed)

- ✅ ~~`src/shared/services/logger.ts`~~ - **COMPLETED**
- `src/shared/services/errorHandler.ts`
- `src/shared/services/imageUploadService.ts` (mock Supabase)

### Phase 4: Custom Hooks (Partially Completed)

- ✅ ~~`src/shared/hooks/useDebounce.ts`~~ - **COMPLETED**
- `src/shared/hooks/use-mobile.tsx`
- `src/shared/hooks/useScrollPosition.ts`

### Phase 5: Components

Start with simple presentational components, then move to complex components with dependencies.

## Best Practices

### DO

✅ Write tests for all new code
✅ Aim for 80%+ coverage on utilities and services
✅ Use descriptive test names that explain what's being tested
✅ Group related tests with `describe` blocks
✅ Test edge cases and error conditions
✅ Use fixtures and factories for consistent test data
✅ Mock external dependencies (Supabase, APIs)

### DON'T

❌ Test implementation details (test behavior, not internals)
❌ Write tests that depend on other tests
❌ Use arbitrary timeouts (use `waitFor` instead)
❌ Mock things that don't need mocking (pure functions)
❌ Skip testing error cases
❌ Leave console errors/warnings in tests

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure path aliases are configured in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, '../src'),
  },
}
```

### Tests timeout

Increase timeout in test or globally:

```typescript
test('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Mock not working

Ensure mocks are declared before imports:

```typescript
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

import { myFunction } from './myModule'; // Import AFTER mock
```

### Coverage thresholds failing

Adjust thresholds in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 70,  // Lower if needed
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
