import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';
/**
 * SinglePageLayout - A minimal baseline layout for simple pages
 *
 * Features:
 * - Navigation bar at the top
 * - Topographic background with gradient overlay
 * - Full-height content area
 * - Site-wide tools (Music Player, Dev Tools) are handled at the App level
 *
 * Use this for pages that need just the basics without footer or complex structure.
 */
export const SinglePageLayout = ({ children, backgroundOpacity = 0.35, className = '', showBackButton = false, onBack, backButtonLabel, }) => {
    return (_jsxs("div", { className: 'min-h-screen bg-background flex flex-col', children: [_jsx(Navigation, {}), _jsxs("main", { className: `flex-1 pt-16 pb-20 relative overflow-hidden ${className}`, children: [_jsx(TopographicBackground, { opacity: backgroundOpacity }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'relative z-10 h-full', children: [showBackButton && (_jsx(FmBackButton, { position: 'floating', onClick: onBack, label: backButtonLabel })), children] })] })] }));
};
