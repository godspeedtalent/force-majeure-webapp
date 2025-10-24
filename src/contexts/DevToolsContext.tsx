import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isDevelopment } from '@/shared/utils/environment';

export type DevRole = 'unauthenticated' | 'fan' | 'admin' | 'developer';

interface DevToolsContextType {
  devRole: DevRole | null;
  setDevRole: (role: DevRole | null) => void;
  isDevMode: boolean;
}

const DevToolsContext = createContext<DevToolsContextType | undefined>(undefined);

const DEV_ROLE_KEY = 'lovable_dev_role_override';

export const DevToolsProvider = ({ children }: { children: ReactNode }) => {
  const isDevMode = isDevelopment();
  const [devRole, setDevRoleState] = useState<DevRole | null>(() => {
    if (!isDevMode) return null;
    const stored = localStorage.getItem(DEV_ROLE_KEY);
    return stored as DevRole | null;
  });

  const setDevRole = (role: DevRole | null) => {
    if (!isDevMode) return;
    
    setDevRoleState(role);
    if (role) {
      localStorage.setItem(DEV_ROLE_KEY, role);
    } else {
      localStorage.removeItem(DEV_ROLE_KEY);
    }
  };

  useEffect(() => {
    if (!isDevMode && devRole) {
      setDevRoleState(null);
      localStorage.removeItem(DEV_ROLE_KEY);
    }
  }, [isDevMode, devRole]);

  return (
    <DevToolsContext.Provider value={{ devRole, setDevRole, isDevMode }}>
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
