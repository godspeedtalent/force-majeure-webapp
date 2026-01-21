import React, { ReactElement } from 'react';
import { render, RenderOptions, waitFor as rtlWaitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { expect } from 'vitest';

// Re-export waitFor with explicit type to fix TypeScript module resolution issues
export const waitFor = rtlWaitFor;

/**
 * Create a new QueryClient for testing with sensible defaults
 * - No retries (tests should be deterministic)
 * - No caching between tests
 * - Errors don't log to console
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render options that extend React Testing Library's RenderOptions
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Provide a custom QueryClient instance
   * If not provided, a new one will be created with test-friendly defaults
   */
  queryClient?: QueryClient;
  /**
   * Initial router entries for testing navigation
   * @default ['/']
   */
  initialEntries?: string[];
  /**
   * Whether to wrap in BrowserRouter
   * @default true
   */
  withRouter?: boolean;
  /**
   * Whether to wrap in QueryClientProvider
   * @default true
   */
  withQueryClient?: boolean;
}

/**
 * Custom render function that wraps components with common providers
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/test/utils/testUtils';
 *
 * test('renders component', () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 *
 * @example With custom QueryClient
 * ```tsx
 * const queryClient = createTestQueryClient();
 * renderWithProviders(<MyComponent />, { queryClient });
 * ```
 *
 * @example With router at specific route
 * ```tsx
 * renderWithProviders(<MyComponent />, {
 *   initialEntries: ['/events/123']
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient,
    initialEntries = ['/'],
    withRouter = true,
    withQueryClient = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const testQueryClient = queryClient || createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    let content = children;

    // Wrap with QueryClientProvider if needed
    if (withQueryClient) {
      content = (
        <QueryClientProvider client={testQueryClient}>
          {content}
        </QueryClientProvider>
      );
    }

    // Wrap with Router if needed
    if (withRouter) {
      content = (
        <BrowserRouter>
          {content}
        </BrowserRouter>
      );
    }

    return <>{content}</>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: testQueryClient,
  };
}

/**
 * Helper to wait for loading states to resolve
 * Useful when testing components with async data fetching
 */
export async function waitForLoadingToFinish() {
  return waitFor(() => {
    const loadingIndicators = document.querySelectorAll('[data-loading="true"]');
    expect(loadingIndicators).toHaveLength(0);
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
