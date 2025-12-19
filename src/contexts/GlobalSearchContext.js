import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, } from 'react';
import { useFeatureFlagHelpers } from '@/shared';
import { FEATURE_FLAGS } from '@/shared';
const GlobalSearchContext = createContext(undefined);
export const GlobalSearchProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { isFeatureEnabled } = useFeatureFlagHelpers();
    const isEnabled = isFeatureEnabled(FEATURE_FLAGS.GLOBAL_SEARCH);
    const openSearch = () => setIsOpen(true);
    const closeSearch = () => setIsOpen(false);
    const toggleSearch = () => setIsOpen(prev => !prev);
    // Hotkey listener: Ctrl+Shift+Space or Cmd+Shift+Space
    useEffect(() => {
        if (!isEnabled)
            return;
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
                e.preventDefault();
                toggleSearch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isEnabled, toggleSearch]);
    return (_jsx(GlobalSearchContext.Provider, { value: { isOpen, openSearch, closeSearch, toggleSearch }, children: children }));
};
export const useGlobalSearch = () => {
    const context = useContext(GlobalSearchContext);
    if (context === undefined) {
        throw new Error('useGlobalSearch must be used within a GlobalSearchProvider');
    }
    return context;
};
