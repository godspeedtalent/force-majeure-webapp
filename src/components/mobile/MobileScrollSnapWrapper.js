import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { useScrollSnap } from '@/shared';
/**
 * Wrapper component that applies scroll snap behavior on mobile only
 * Desktop behavior is completely unaffected
 */
export const MobileScrollSnapWrapper = ({ children, className, enabled = true, onSectionChange, }) => {
    const isMobile = useIsMobile();
    const containerRef = useRef(null);
    const { activeSection } = useScrollSnap({
        enabled: enabled && isMobile,
        onSectionChange,
    });
    // Apply scroll snap styles only on mobile
    const scrollSnapClass = isMobile && enabled
        ? 'snap-y snap-mandatory overflow-y-auto'
        : '';
    useEffect(() => {
        if (isMobile && enabled && activeSection) {
            // Optional: Add haptic feedback on section change (if supported)
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        }
    }, [isMobile, enabled, activeSection]);
    return (_jsx("div", { ref: containerRef, className: cn(scrollSnapClass, className), style: isMobile && enabled
            ? {
                scrollPaddingTop: '64px', // Account for fixed navigation
                scrollBehavior: 'smooth',
            }
            : undefined, children: children }));
};
