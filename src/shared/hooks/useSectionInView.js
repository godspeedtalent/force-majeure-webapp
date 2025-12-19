import { useEffect, useState } from 'react';
/**
 * Hook to detect when a section is in view using Intersection Observer
 * Returns boolean indicating if the section is currently visible
 */
export const useSectionInView = (ref, options = {}) => {
    const { threshold = 0.5, rootMargin = '-10% 0px -10% 0px', enabled = true, } = options;
    const [isInView, setIsInView] = useState(false);
    useEffect(() => {
        if (!enabled || !ref.current)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
        }, {
            threshold,
            rootMargin,
        });
        observer.observe(ref.current);
        return () => {
            observer.disconnect();
        };
    }, [ref, threshold, rootMargin, enabled]);
    return isInView;
};
