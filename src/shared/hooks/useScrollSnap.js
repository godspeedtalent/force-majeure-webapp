import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';
/**
 * Hook for managing scroll snap behavior on mobile
 * Tracks active section and provides utilities for section navigation
 */
export const useScrollSnap = (options = {}) => {
    const { enabled = true, threshold = 0.5, onSectionChange, } = options;
    const isMobile = useIsMobile();
    const [activeSection, setActiveSection] = useState(null);
    const [isSnapping, setIsSnapping] = useState(false);
    const [sections, setSections] = useState(new Map());
    const isEnabled = enabled && isMobile;
    // Register a section for tracking
    const registerSection = useCallback((section) => {
        setSections(prev => new Map(prev).set(section.id, section));
    }, []);
    // Unregister a section
    const unregisterSection = useCallback((sectionId) => {
        setSections(prev => {
            const newSections = new Map(prev);
            newSections.delete(sectionId);
            return newSections;
        });
    }, []);
    // Scroll to a specific section
    const scrollToSection = useCallback((sectionId) => {
        const section = sections.get(sectionId);
        if (!section?.ref.current)
            return;
        setIsSnapping(true);
        section.ref.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
        // Reset snapping state after animation
        setTimeout(() => setIsSnapping(false), 500);
    }, [sections]);
    // Track active section using intersection observer
    useEffect(() => {
        if (!isEnabled || sections.size === 0)
            return;
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
                    const sectionId = entry.target.getAttribute('data-section-id');
                    if (sectionId && sectionId !== activeSection) {
                        setActiveSection(sectionId);
                        onSectionChange?.(sectionId);
                    }
                }
            });
        }, {
            threshold,
            rootMargin: '-10% 0px -10% 0px',
        });
        // Observe all registered sections
        sections.forEach(section => {
            if (section.ref.current) {
                section.ref.current.setAttribute('data-section-id', section.id);
                observer.observe(section.ref.current);
            }
        });
        return () => {
            observer.disconnect();
        };
    }, [isEnabled, sections, threshold, activeSection, onSectionChange]);
    return {
        activeSection,
        scrollToSection,
        isSnapping,
        registerSection,
        unregisterSection,
    };
};
