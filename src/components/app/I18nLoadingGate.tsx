import { useEffect, useState, ReactNode } from 'react';
import { diagInfo } from '@/shared/services/initDiagnostics';
import i18n from '@/i18n/config';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';

// i18n Loading Gate - ensures translations are ready before rendering
// Has a 2-second timeout as safety net for non-English languages
const I18N_LOADING_TIMEOUT = 2000;

interface I18nLoadingGateProps {
  children: ReactNode;
}

/**
 * Gate component that waits for i18n translations to load before rendering children.
 * Includes a safety timeout to prevent blocking forever if translations fail.
 */
export const I18nLoadingGate = ({ children }: I18nLoadingGateProps) => {
  const [isReady, setIsReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      diagInfo('i18n.gate.already_ready');
      return;
    }

    diagInfo('i18n.gate.waiting');

    // Safety timeout - don't block forever if translations fail to load
    const timeout = setTimeout(() => {
      diagInfo('i18n.gate.timeout');
      setIsReady(true);
    }, I18N_LOADING_TIMEOUT);

    // Listen for i18n initialization
    const handleInitialized = () => {
      diagInfo('i18n.gate.initialized');
      clearTimeout(timeout);
      setIsReady(true);
    };

    i18n.on('initialized', handleInitialized);

    // Also check loaded event for language resources
    const handleLoaded = () => {
      if (i18n.isInitialized) {
        diagInfo('i18n.gate.loaded');
        clearTimeout(timeout);
        setIsReady(true);
      }
    };

    i18n.on('loaded', handleLoaded);

    return () => {
      clearTimeout(timeout);
      i18n.off('initialized', handleInitialized);
      i18n.off('loaded', handleLoaded);
    };
  }, []);

  if (!isReady) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <FmGoldenGridLoader size='lg' />
      </div>
    );
  }

  return <>{children}</>;
};
