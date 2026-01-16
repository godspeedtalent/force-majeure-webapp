import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

interface BackButtonConfig {
  /** Whether to show the back button */
  show: boolean;
  /** Custom click handler (default: navigate(-1)) */
  onClick?: () => void;
  /** Label text for the back button */
  label?: string;
}

interface NavigationContextType {
  /** Current back button configuration */
  backButton: BackButtonConfig;
  /** Set back button configuration */
  setBackButton: (config: BackButtonConfig) => void;
  /** Clear back button (hide it) */
  clearBackButton: () => void;
}

const defaultBackButton: BackButtonConfig = {
  show: false,
};

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [backButton, setBackButtonState] = useState<BackButtonConfig>(defaultBackButton);
  const location = useLocation();

  const setBackButton = useCallback((config: BackButtonConfig) => {
    setBackButtonState(config);
  }, []);

  const clearBackButton = useCallback(() => {
    setBackButtonState(defaultBackButton);
  }, []);

  // Clear back button on route change to prevent stale state
  useEffect(() => {
    setBackButtonState(defaultBackButton);
  }, [location.pathname]);

  return (
    <NavigationContext.Provider
      value={{
        backButton,
        setBackButton,
        clearBackButton,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to access navigation context for back button control
 *
 * @example
 * // In a layout component
 * const { setBackButton } = useNavigation();
 *
 * useEffect(() => {
 *   if (showBackButton) {
 *     setBackButton({ show: true, onClick: onBack, label: 'Home' });
 *   }
 * }, [showBackButton, onBack]);
 */
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

/**
 * Hook to set back button configuration when a component mounts
 * Automatically clears when the component unmounts
 *
 * @example
 * // Show back button with custom handler
 * useBackButton({ show: true, onClick: () => navigate('/'), label: 'Home' });
 *
 * @example
 * // Conditionally show back button
 * useBackButton({ show: isEditing, onClick: handleCancel, label: 'Cancel' });
 */
export const useBackButton = (config: BackButtonConfig) => {
  const { setBackButton, clearBackButton } = useNavigation();

  useEffect(() => {
    setBackButton(config);
    return () => clearBackButton();
  }, [config.show, config.label, config.onClick, setBackButton, clearBackButton]);
};
