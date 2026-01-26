import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

// Import diagnostics FIRST to track everything
import { diagStart, diagComplete, diagInfo } from '@/shared/services/initDiagnostics';

diagStart('imports');

// Initialize Supabase
import './lib/supabase';
diagInfo('supabase.imported');

// Initialize i18n before React renders
import './i18n/config';
diagInfo('i18n.imported');
import './index.css';

import App from './App';
diagComplete('imports');

// Loading fallback for translations
const TranslationLoader = () => {
  diagInfo('suspense.fallback', { reason: 'i18n still loading' });
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="animate-pulse text-white/50">Loading...</div>
    </div>
  );
};

diagStart('react.render');
createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <Suspense fallback={<TranslationLoader />}>
      <App />
    </Suspense>
  </HelmetProvider>
);
diagComplete('react.render');
