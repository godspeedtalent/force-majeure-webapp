/**
 * Centralized Tailwind CSS theme configuration
 * Imports and organizes all theme modules
 */
import { keyframes, animations } from './animations';
import { colors } from './colors';
import { backgroundImage, boxShadow } from './effects';
import { container } from './layout';
import { fontFamily, borderRadius } from './typography';
export const themeConfig = {
    container,
    extend: {
        colors,
        borderRadius,
        fontFamily,
        keyframes,
        animation: animations,
        backgroundImage,
        boxShadow,
    },
};
