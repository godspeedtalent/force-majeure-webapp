import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Helper to get initial mobile state during SSR-safe initialization.
 * Returns undefined during SSR, actual value on client.
 */
function getInitialMobileState(): boolean | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/**
 * Hook to detect if the current viewport is mobile-sized.
 *
 * IMPORTANT: Returns `undefined` during initial SSR render.
 * Components should handle the `undefined` state appropriately (e.g., show loading
 * state or render a safe default).
 */
export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    getInitialMobileState
  );

  React.useEffect(() => {
    // Ensure we have the correct value after mount (handles SSR hydration)
    const currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (isMobile !== currentIsMobile) {
      setIsMobile(currentIsMobile);
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [isMobile]);

  return isMobile;
}
