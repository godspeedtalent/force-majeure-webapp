import { useEffect, useState } from 'react';
import { logger } from '@/shared/services/logger';
/**
 * Hook to detect when a specific font has finished loading.
 * Uses the CSS Font Loading API to check font load status.
 *
 * @param fontFamily - The font family name to check (e.g., 'Canela Deck', 'FK Screamer')
 * @param fallbackTimeout - Maximum time to wait for font before considering it loaded (default: 3000ms)
 * @returns boolean indicating if the font is loaded
 *
 * @example
 * const isCanelaLoaded = useFontLoaded('Canela Deck');
 */
export const useFontLoaded = (fontFamily, fallbackTimeout = 3000) => {
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        // Check if CSS Font Loading API is available
        if (!('fonts' in document)) {
            // Fallback: assume font is loaded after timeout
            const timer = setTimeout(() => setIsLoaded(true), fallbackTimeout);
            return () => clearTimeout(timer);
        }
        // Check if font is already loaded
        const checkFontLoaded = async () => {
            try {
                await document.fonts.load(`1em "${fontFamily}"`);
                setIsLoaded(true);
            }
            catch (error) {
                // If font check fails, fallback to assuming it's loaded
                logger.warn(`Font loading check failed for "${fontFamily}"`, {
                    error: error instanceof Error ? error.message : 'Unknown',
                    source: 'useFontLoaded'
                });
                setIsLoaded(true);
            }
        };
        // Start checking
        checkFontLoaded();
        // Also set a fallback timeout in case font never loads
        const fallbackTimer = setTimeout(() => {
            if (!isLoaded) {
                logger.warn(`Font "${fontFamily}" did not load within ${fallbackTimeout}ms, showing content anyway`, {
                    source: 'useFontLoaded',
                    fontFamily,
                    timeout: fallbackTimeout
                });
                setIsLoaded(true);
            }
        }, fallbackTimeout);
        return () => clearTimeout(fallbackTimer);
    }, [fontFamily, fallbackTimeout, isLoaded]);
    return isLoaded;
};
/**
 * Convenience hook for checking if Canela Deck font is loaded.
 * This is the primary font used throughout the application.
 */
export const useCanelaLoaded = () => useFontLoaded('Canela Deck');
/**
 * Convenience hook for checking if FK Screamer font is loaded.
 * This is the display font used for headers.
 */
export const useScreamerLoaded = () => useFontLoaded('FK Screamer');
