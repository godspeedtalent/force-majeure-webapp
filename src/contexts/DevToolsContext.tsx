import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isDevelopment } from '@/shared/utils/environment';

interface DevToolsContextType {
  isDevMode: boolean;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}

const DevToolsContext = createContext<DevToolsContextType | undefined>(undefined);

export const DevToolsProvider = ({ children }: { children: ReactNode }) => {
  const isDevMode = isDevelopment();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  // Hotkey listener: Ctrl+Shift+D or Cmd+Shift+D
  useEffect(() => {
    if (!isDevMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevMode]);

  return (
    <DevToolsContext.Provider value={{ isDevMode, isDrawerOpen, toggleDrawer }}>
      {children}
    </DevToolsContext.Provider>
  );
};

export const useDevTools = () => {
  const context = useContext(DevToolsContext);
  if (context === undefined) {
    throw new Error('useDevTools must be used within a DevToolsProvider');
  }
  return context;
};
