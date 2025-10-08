import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { mockAuthContext } from './mocks';

import { AuthContext } from '@/features/auth/services/AuthContext';

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: typeof mockAuthContext;
  queryClient?: QueryClient;
}

function AllTheProviders({
  children,
  authContext = mockAuthContext,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
}: {
  children: ReactNode;
  authContext?: typeof mockAuthContext;
  queryClient?: QueryClient;
}) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContext}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { authContext, queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: props =>
      AllTheProviders({
        ...props,
        authContext: authContext || mockAuthContext,
        queryClient,
      }),
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
