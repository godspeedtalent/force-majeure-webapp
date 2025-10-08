# Testing Infrastructure Documentation

## Overview

This testing infrastructure provides a comprehensive foundation for unit testing the Force Majeure Pulse React application. The setup includes configuration, mocking, utilities, and patterns for testing React components, custom hooks, and API interactions.

## Structure

```
src/test/
├── setup.ts              # Global test configuration and setup
├── mocks/
│   ├── index.ts          # Mock objects and utilities
│   └── server.ts         # MSW server configuration
├── utils/
│   ├── render.tsx        # Custom render functions with providers
│   └── helpers.ts        # Test utility functions
├── fixtures/
│   └── index.ts          # Test data and constants
├── matchers/
│   └── index.ts          # Custom Jest/Vitest matchers
└── patterns/
    └── index.ts          # Testing patterns and examples
```

## Dependencies Required

To use this testing infrastructure, install the following dependencies:

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",
    "jsdom": "^23.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

Install with:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw jsdom @vitest/coverage-v8
```

## Configuration

### Vitest Configuration (`vitest.config.ts`)

- **Environment**: jsdom for DOM testing
- **Coverage**: Istanbul with v8 provider
- **Thresholds**: 80% coverage for all metrics
- **Setup**: Automatic test setup and MSW integration

### Test Setup (`src/test/setup.ts`)

- **Global Mocks**: Supabase client, router navigation
- **Polyfills**: fetch, IntersectionObserver, matchMedia
- **Matchers**: Custom Jest/Vitest matchers
- **MSW**: Request mocking server setup

## Mocking Strategy

### Supabase Client Mock

Comprehensive mock of Supabase client including:

- Authentication methods
- Database queries (select, insert, update, delete)
- Real-time subscriptions
- Storage operations

### API Mocking with MSW

Pre-configured handlers for:

- Authentication endpoints
- Scavenger hunt locations
- User profiles and claims
- Feature flags

### Component Mocks

Common React component mocks:

- React Router navigation
- External libraries
- Complex UI components

## Testing Utilities

### Custom Render Functions

- `render`: Standard render with providers
- `renderWithProviders`: Render with custom provider state
- `renderHook`: Hook testing with provider context

### Test Helpers

- `createMockUser`: Generate test user objects
- `createMockLocation`: Generate scavenger location data
- `createMockClaim`: Generate user claim data
- `waitForAsyncOperations`: Handle async state updates

### Test Fixtures

Predefined test data including:

- User profiles and authentication states
- Scavenger hunt locations and claims
- Feature flag configurations
- Validation tokens and codes

## Custom Matchers

Extended Jest/Vitest matchers for React testing:

- `toBeVisible()`: Check element visibility
- `toHaveLoadingState()`: Verify loading indicators
- `toHaveErrorState()`: Verify error states

## Usage Patterns

### Component Testing

```typescript
import { render, screen } from '@/test/utils/render'
import { MyComponent } from '@/components/MyComponent'

test('renders correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected text')).toBeInTheDocument()
})
```

### Hook Testing

```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

test('hook returns expected value', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current.value).toBe('expected');
});
```

### API Testing with MSW

```typescript
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

test('handles API response', async () => {
  server.use(
    http.get('/api/test', () => HttpResponse.json({ data: 'test' }))
  )

  render(<ComponentThatFetchesData />)
  await screen.findByText('test')
})
```

## Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Best Practices

1. **Test Organization**: Group related tests in describe blocks
2. **Async Testing**: Use `findBy*` queries for async elements
3. **User Interactions**: Test from user perspective
4. **Mock Management**: Keep mocks close to tests that use them
5. **Coverage**: Aim for meaningful tests, not just coverage numbers

## Project-Specific Considerations

### Authentication Context

Most components require authentication state. Use the provided auth mocks:

```typescript
renderWithProviders(<ProtectedComponent />, {
  authState: { user: TEST_USER, isAuthenticated: true }
})
```

### Supabase Integration

Components using Supabase should mock the client appropriately:

```typescript
import { mockSupabaseClient } from '@/test/mocks';

// Mock successful query
mockSupabaseClient.from.mockReturnValue({
  select: vi.fn().mockResolvedValue({ data: TEST_DATA, error: null }),
});
```

### Feature Flags

Test components with different feature flag states:

```typescript
renderWithProviders(<FeatureComponent />, {
  featureFlags: { scavenger_hunt_active: true }
})
```

## Getting Started

1. Install the required dependencies
2. Run `npm test` to verify the setup
3. Create your first test file following the patterns in `src/test/patterns/`
4. Use the fixtures and utilities to build comprehensive tests

The infrastructure is designed to be comprehensive yet flexible, allowing for easy testing of all application components while maintaining consistency and reducing boilerplate.
