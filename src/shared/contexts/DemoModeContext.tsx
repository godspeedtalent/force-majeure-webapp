import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import {
  type DemoModeSettings,
  type DemoModeContextValue,
  DEFAULT_DEMO_MODE_SETTINGS,
} from '@/features/demo-mode/types';

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

const STORAGE_KEY = 'fm-demo-mode-settings';

interface DemoModeProviderProps {
  children: ReactNode;
}

/**
 * Provider for demo mode functionality.
 * Manages touch visualization settings and enabled state.
 *
 * Note: The `enabled` state is NOT persisted - it always starts as false
 * on page load for safety. Only settings are persisted.
 */
export const DemoModeProvider = ({ children }: DemoModeProviderProps) => {
  // Persisted settings (excluding enabled state)
  const [persistedSettings, setPersistedSettings] = useLocalStorage<
    Omit<DemoModeSettings, 'enabled'>
  >(STORAGE_KEY, {
    delayEnabled: DEFAULT_DEMO_MODE_SETTINGS.delayEnabled,
    delayDuration: DEFAULT_DEMO_MODE_SETTINGS.delayDuration,
    indicatorSize: DEFAULT_DEMO_MODE_SETTINGS.indicatorSize,
    showLongPressIndicator: DEFAULT_DEMO_MODE_SETTINGS.showLongPressIndicator,
    longPressThreshold: DEFAULT_DEMO_MODE_SETTINGS.longPressThreshold,
  });

  // Enabled state is NOT persisted - always starts false
  const [enabled, setEnabled] = useState(false);

  // Combine persisted settings with runtime enabled state
  const settings: DemoModeSettings = useMemo(
    () => ({
      ...persistedSettings,
      enabled,
    }),
    [persistedSettings, enabled]
  );

  const updateSettings = useCallback(
    (partial: Partial<DemoModeSettings>) => {
      // Handle enabled separately since it's not persisted
      if ('enabled' in partial) {
        setEnabled(partial.enabled ?? false);
      }

      // Persist other settings
      const { enabled: _enabled, ...settingsToStore } = partial;
      if (Object.keys(settingsToStore).length > 0) {
        setPersistedSettings(prev => ({
          ...prev,
          ...settingsToStore,
        }));
      }
    },
    [setPersistedSettings]
  );

  const enable = useCallback(() => {
    setEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  // Disable demo mode on visibility change (when user switches tabs)
  // This prevents accidentally leaving it on
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && enabled) {
        // Optionally disable when tab becomes hidden
        // Uncomment if desired: setEnabled(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      isActive: enabled,
      enable,
      disable,
      toggle,
    }),
    [settings, updateSettings, enabled, enable, disable, toggle]
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
};

/**
 * Hook to access demo mode context.
 * Must be used within a DemoModeProvider.
 */
export const useDemoMode = (): DemoModeContextValue => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};

/**
 * Safe version of useDemoMode that returns defaults when context is not available.
 * Use this in components that may render outside of DemoModeProvider.
 */
export const useDemoModeSafe = (): DemoModeContextValue => {
  const context = useContext(DemoModeContext);

  if (!context) {
    return {
      settings: DEFAULT_DEMO_MODE_SETTINGS,
      updateSettings: () => {},
      isActive: false,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
    };
  }

  return context;
};
