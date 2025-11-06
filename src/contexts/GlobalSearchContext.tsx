import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

interface GlobalSearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined);

export const GlobalSearchProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const isEnabled = isFeatureEnabled(FEATURE_FLAGS.GLOBAL_SEARCH);

  const openSearch = () => setIsOpen(true);
  const closeSearch = () => setIsOpen(false);
  const toggleSearch = () => setIsOpen(prev => !prev);

  // Hotkey listener: Ctrl+Shift+Space or Cmd+Shift+Space
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        toggleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, toggleSearch]);

  return (
    <GlobalSearchContext.Provider value={{ isOpen, openSearch, closeSearch, toggleSearch }}>
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearch = () => {
  const context = useContext(GlobalSearchContext);
  if (context === undefined) {
    throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
  }
  return context;
};
