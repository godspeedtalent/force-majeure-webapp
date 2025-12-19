import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { cn } from '@/shared';
export const AnimatedCounter = ({ value, duration = 1000, className, }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime;
        let animationFrame;
        const animate = (currentTime) => {
            if (!startTime)
                startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            // Ease out cubic
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOutCubic * value));
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };
        animationFrame = requestAnimationFrame(animate);
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [value, duration]);
    return (_jsx("span", { className: cn('font-display text-fm-gold', className), children: count }));
};
