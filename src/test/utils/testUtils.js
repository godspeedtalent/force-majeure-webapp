import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { expect } from 'vitest';
/**
 * Create a new QueryClient for testing with sensible defaults
 * - No retries (tests should be deterministic)
 * - No caching between tests
 * - Errors don't log to console
 */
export function createTestQueryClient() {
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
export function renderWithProviders(ui, { queryClient, initialEntries = ['/'], withRouter = true, withQueryClient = true, ...renderOptions } = {}) {
    const testQueryClient = queryClient || createTestQueryClient();
    function Wrapper({ children }) {
        let content = children;
        // Wrap with QueryClientProvider if needed
        if (withQueryClient) {
            content = (_jsx(QueryClientProvider, { client: testQueryClient, children: content }));
        }
        // Wrap with Router if needed
        if (withRouter) {
            content = (_jsx(BrowserRouter, { children: content }));
        }
        return _jsx(_Fragment, { children: content });
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
    const { waitFor } = await import('@testing-library/react');
    return waitFor(() => {
        const loadingIndicators = document.querySelectorAll('[data-loading="true"]');
        expect(loadingIndicators).toHaveLength(0);
    });
}
// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
