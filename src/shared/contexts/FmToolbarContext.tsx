/**
 * FmToolbarContext
 *
 * Provides external control over the FmToolbar state.
 * Allows other components to open specific tabs programmatically.
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface FmToolbarContextValue {
  /** Currently active tab ID */
  activeTab: string | null;
  /** Whether the toolbar drawer is open */
  isOpen: boolean;
  /** Open a specific tab by ID */
  openTab: (tabId: string) => void;
  /** Close the toolbar drawer */
  closeToolbar: () => void;
  /** Toggle the toolbar open/closed */
  toggleToolbar: () => void;
  /** Set active tab (for internal use by FmToolbar) */
  setActiveTab: (tabId: string | null) => void;
  /** Set open state (for internal use by FmToolbar) */
  setIsOpen: (isOpen: boolean) => void;
}

const FmToolbarContext = createContext<FmToolbarContextValue | null>(null);

interface FmToolbarProviderProps {
  children: ReactNode;
}

export const FmToolbarProvider = ({ children }: FmToolbarProviderProps) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(true);
  }, []);

  const closeToolbar = useCallback(() => {
    setIsOpen(false);
    setActiveTab(null);
  }, []);

  const toggleToolbar = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    activeTab,
    isOpen,
    openTab,
    closeToolbar,
    toggleToolbar,
    setActiveTab,
    setIsOpen,
  }), [activeTab, isOpen, openTab, closeToolbar, toggleToolbar]);

  return (
    <FmToolbarContext.Provider value={value}>
      {children}
    </FmToolbarContext.Provider>
  );
};

export const useFmToolbar = (): FmToolbarContextValue => {
  const context = useContext(FmToolbarContext);
  if (!context) {
    throw new Error('useFmToolbar must be used within a FmToolbarProvider');
  }
  return context;
};

/**
 * Safe version that returns no-op defaults when context is not available
 */
export const useFmToolbarSafe = (): FmToolbarContextValue => {
  const context = useContext(FmToolbarContext);

  if (!context) {
    return {
      activeTab: null,
      isOpen: false,
      openTab: () => {},
      closeToolbar: () => {},
      toggleToolbar: () => {},
      setActiveTab: () => {},
      setIsOpen: () => {},
    };
  }

  return context;
};
