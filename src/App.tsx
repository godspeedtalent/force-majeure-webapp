import { useEffect } from 'react';
import { initDiagnostics, diagInfo } from '@/shared/services/initDiagnostics';
import { AppProviders, AppRoutes, AppLayout } from '@/core';

/**
 * Main application component.
 *
 * Structure:
 * - AppProviders: All context providers (auth, cart, stripe, etc.)
 * - AppRoutes: Route definitions organized by domain
 * - AppLayout: Global UI elements (toolbar, overlays)
 *
 * @see src/core/AppProviders.tsx - Provider composition and order
 * @see src/core/AppRoutes.tsx - Route orchestrator
 * @see src/core/AppLayout.tsx - Global UI elements
 * @see src/routes/ - Route definitions by domain
 */
const App = () => {
  diagInfo('app.rendering');

  // Start health monitor after initial load
  useEffect(() => {
    // Give init 5 seconds to complete, then start monitoring
    const timer = setTimeout(() => {
      initDiagnostics.startHealthMonitor(60000); // Check every 60 seconds
    }, 5000);

    return () => {
      clearTimeout(timer);
      initDiagnostics.stopHealthMonitor();
    };
  }, []);

  // Force dark mode by adding class to html element
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return (
    <AppProviders>
      <AppRoutes />
      <AppLayout />
    </AppProviders>
  );
};

export default App;
