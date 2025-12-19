import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// Initialize Supabase
import './lib/supabase';

// Initialize i18n before React renders
import './i18n/config';
import './index.css';

import App from './App';

// Loading fallback for translations
const TranslationLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="animate-pulse text-white/50">Loading...</div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<TranslationLoader />}>
    <App />
  </Suspense>
);
