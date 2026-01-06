import { useEffect, useCallback, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface UseUnsavedChangesOptions {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Whether to block navigation (defaults to isDirty) */
  enabled?: boolean;
  /** Custom message for the browser's beforeunload dialog */
  message?: string;
}

export interface UseUnsavedChangesReturn {
  /** Whether the blocker dialog should be shown */
  showDialog: boolean;
  /** Confirm navigation and proceed */
  confirmNavigation: () => void;
  /** Cancel navigation and stay on page */
  cancelNavigation: () => void;
  /** The blocker state */
  blockerState: 'blocked' | 'unblocked' | 'proceeding';
  /**
   * Wrap navigation actions to trigger the unsaved changes dialog.
   * Call this before navigating away (e.g., in onClick handlers).
   * Returns true if navigation should proceed, false if blocked.
   */
  guardNavigation: (targetPath: string) => boolean;
}

/**
 * Hook to warn users about unsaved changes when navigating away from a form.
 *
 * Handles:
 * - Browser navigation (closing tab, refresh) - shows browser's native dialog
 * - Browser back/forward buttons - shows custom dialog
 * - In-app navigation - use guardNavigation() to check before navigating
 *
 * Note: This hook works with BrowserRouter. For automatic blocking of all
 * React Router navigation, the app would need to migrate to createBrowserRouter.
 *
 * @example
 * ```tsx
 * const { isDirty } = useFormState({ initialData: { ... } });
 * const unsavedChanges = useUnsavedChanges({ isDirty });
 *
 * // For programmatic navigation:
 * const handleBack = () => {
 *   if (unsavedChanges.guardNavigation('/previous-page')) {
 *     navigate('/previous-page');
 *   }
 * };
 *
 * return (
 *   <>
 *     <form>...</form>
 *     <UnsavedChangesDialog
 *       open={unsavedChanges.showDialog}
 *       onConfirm={unsavedChanges.confirmNavigation}
 *       onCancel={unsavedChanges.cancelNavigation}
 *     />
 *   </>
 * );
 * ```
 */
export function useUnsavedChanges({
  isDirty,
  enabled,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const location = useLocation();
  const navigate = useNavigate();

  // Track mount state to avoid blocking during initial render
  const [isMounted, setIsMounted] = useState(false);
  const [blockerState, setBlockerState] = useState<'blocked' | 'unblocked' | 'proceeding'>('unblocked');
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Track the initial location to detect back button presses
  const initialPathRef = useRef(location.pathname);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    initialPathRef.current = location.pathname;
    return () => setIsMounted(false);
  }, []);

  // Only block after component is mounted and form is dirty
  const shouldBlock = isMounted && (enabled ?? isDirty);

  // Handle browser navigation (closing tab, external links, refresh)
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages, but we set it for older browsers
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // Handle browser back/forward buttons using popstate
  useEffect(() => {
    if (!shouldBlock) return;

    const handlePopState = () => {
      // If we're already navigating programmatically, don't block
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      // Block the navigation by pushing the current state back
      window.history.pushState(null, '', location.pathname);
      setPendingPath('__back__'); // Special marker for back navigation
      setBlockerState('blocked');
    };

    // Push initial state to enable popstate detection
    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock, location.pathname]);

  // Guard function for programmatic navigation
  const guardNavigation = useCallback(
    (targetPath: string): boolean => {
      if (!shouldBlock) {
        return true; // Allow navigation
      }

      // Block and show dialog
      setPendingPath(targetPath);
      setBlockerState('blocked');
      return false;
    },
    [shouldBlock]
  );

  const confirmNavigation = useCallback(() => {
    setBlockerState('proceeding');

    if (pendingPath === '__back__') {
      // For back button, go back in history
      isNavigatingRef.current = true;
      window.history.back();
    } else if (pendingPath) {
      // For programmatic navigation, navigate to the pending path
      isNavigatingRef.current = true;
      navigate(pendingPath);
    }

    // Reset state after a short delay to allow navigation to complete
    setTimeout(() => {
      setBlockerState('unblocked');
      setPendingPath(null);
    }, 100);
  }, [pendingPath, navigate]);

  const cancelNavigation = useCallback(() => {
    setBlockerState('unblocked');
    setPendingPath(null);
  }, []);

  return {
    showDialog: blockerState === 'blocked',
    confirmNavigation,
    cancelNavigation,
    blockerState,
    guardNavigation,
  };
}
