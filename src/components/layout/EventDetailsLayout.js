import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
/**
 * EventDetailsLayout - Parallax Scrolling Layout
 *
 * Features:
 * - Hero image fixed in background on desktop
 * - Content scrolls over hero image with parallax effect
 * - Mobile: stacked layout (hero above content)
 * - Desktop: content overlays hero with transparent background
 *
 * Z-Index Hierarchy:
 * - z-0: Background (topography pattern)
 * - z-10: Left column (hero image)
 * - z-20: Right column (content + UX elements)
 */
export function EventDetailsLayout({ leftColumn, rightColumn, className, }) {
    return (_jsxs("div", { className: cn('min-h-screen bg-background relative', className), children: [_jsxs("div", { className: 'absolute inset-0 pointer-events-none overflow-hidden z-0', children: [_jsx(TopographicBackground, { opacity: 0.35, parallax: false }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' })] }), _jsxs("div", { className: 'lg:hidden relative z-10', children: [_jsx("div", { className: 'max-h-[40vh]', children: leftColumn }), _jsx("div", { className: 'relative z-20', children: rightColumn })] }), _jsxs("div", { className: 'hidden lg:flex lg:h-screen', children: [_jsx("div", { className: 'relative overflow-hidden flex-shrink-0 h-screen z-10', children: leftColumn }), _jsx("div", { className: 'flex-1 overflow-y-auto relative h-screen z-20', children: _jsx("div", { className: 'relative flex items-center justify-center min-h-full', children: _jsx("div", { className: 'w-full max-w-4xl mx-auto px-8', children: rightColumn }) }) })] })] }));
}
