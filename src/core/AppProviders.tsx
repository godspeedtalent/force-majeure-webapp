import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

// Core providers
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/features/auth/services/AuthContext';
import { StripeProvider } from '@/features/payments';
import { AnalyticsProvider } from '@/features/analytics';

// Shared context providers
import { DemoModeProvider } from '@/shared/contexts/DemoModeContext';
import { MockRoleProvider } from '@/shared/contexts/MockRoleContext';
import { FmToolbarProvider } from '@/shared/contexts/FmToolbarContext';
import { ShoppingCartProvider } from '@/shared';

// App context providers
import { GlobalSearchProvider } from '@/contexts/GlobalSearchContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';

// UI providers
import { TooltipProvider } from '@/components/common/shadcn/tooltip';
import { Toaster as Sonner } from '@/components/common/shadcn/sonner';

// Error handling & loading
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { I18nLoadingGate } from '@/components/app';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Providers that DON'T require React Router (no useLocation, useNavigate, etc.)
 * These can safely wrap the BrowserRouter.
 */
const CoreProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DemoModeProvider>
        <MockRoleProvider>
          <FmToolbarProvider>
            <StripeProvider>
              <ShoppingCartProvider>
                <GlobalSearchProvider>
                  <TooltipProvider>{children}</TooltipProvider>
                </GlobalSearchProvider>
              </ShoppingCartProvider>
            </StripeProvider>
          </FmToolbarProvider>
        </MockRoleProvider>
      </DemoModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

/**
 * Providers that REQUIRE React Router (use useLocation, useNavigate, etc.)
 * These must be inside the BrowserRouter.
 */
const RouterProviders = ({ children }: { children: ReactNode }) => (
  <NavigationProvider>
    <AnalyticsProvider>
      <CheckoutProvider>{children}</CheckoutProvider>
    </AnalyticsProvider>
  </NavigationProvider>
);

/**
 * Full provider composition for the application.
 *
 * Provider order is critical:
 * 1. ErrorBoundary - outermost for error catching
 * 2. I18nLoadingGate - waits for translations
 * 3. QueryClientProvider - React Query (needed by AuthProvider)
 * 4. AuthProvider - authentication (needed by MockRoleProvider, AnalyticsProvider)
 * 5. DemoModeProvider, MockRoleProvider - debug/testing features
 * 6. FmToolbarProvider - toolbar state
 * 7. StripeProvider - payment integration
 * 8. ShoppingCartProvider - cart state
 * 9. GlobalSearchProvider - search state
 * 10. TooltipProvider - Radix tooltips
 * 11. BrowserRouter - routing (separates router-independent from router-dependent)
 * 12. NavigationProvider - back button state (uses useLocation)
 * 13. AnalyticsProvider - page tracking (uses router)
 * 14. CheckoutProvider - checkout timer (uses useLocation)
 */
export const AppProviders = ({ children }: AppProvidersProps) => (
  <ErrorBoundary>
    <I18nLoadingGate>
      <CoreProviders>
        <Sonner />
        <BrowserRouter>
          <RouterProviders>{children}</RouterProviders>
        </BrowserRouter>
      </CoreProviders>
    </I18nLoadingGate>
  </ErrorBoundary>
);
