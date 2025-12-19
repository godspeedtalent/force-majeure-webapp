import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { cn } from '@/shared';
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const OVERFLOW_REGEX = /(auto|scroll|overlay)/;
const PROGRESS_EPSILON = 0.01;
const renderPreset = (preset, variant) => {
    if (variant === 'primary') {
        return (_jsxs("div", { className: 'space-y-4', children: [preset.eyebrow && (_jsx("p", { className: 'text-xs uppercase tracking-[0.35em] text-muted-foreground/80', children: preset.eyebrow })), _jsxs("div", { className: 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx("h2", { className: 'text-2xl font-canela font-medium text-foreground', children: preset.title }), preset.subtitle && (_jsx("p", { className: 'text-sm text-muted-foreground/90', children: preset.subtitle }))] }), preset.trailing && (_jsx("div", { className: 'sm:flex-shrink-0', children: preset.trailing }))] }), preset.meta && (_jsx("div", { className: 'text-sm text-muted-foreground/90', children: preset.meta }))] }));
    }
    return (_jsxs("div", { className: 'flex items-center justify-between gap-3', children: [_jsxs("div", { className: 'min-w-0 space-y-1', children: [preset.eyebrow && (_jsx("p", { className: 'text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80', children: preset.eyebrow })), _jsx("h3", { className: 'truncate text-sm font-semibold text-foreground', children: preset.title }), preset.meta && (_jsx("div", { className: 'text-xs text-muted-foreground/80', children: preset.meta }))] }), preset.trailing && (_jsx("div", { className: 'flex-shrink-0', children: preset.trailing }))] }));
};
const findScrollParent = (element) => {
    if (typeof window === 'undefined' || !element) {
        return null;
    }
    let parent = element.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        const overflow = `${style.overflow}${style.overflowX}${style.overflowY}`;
        if (OVERFLOW_REGEX.test(overflow)) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
};
export const FmDynamicStickyHeader = ({ primary, primaryContent, sticky, stickyContent, transitionDistance, scrollContainerRef, stickyOffset = 0, className, primaryClassName, stickyClassName, }) => {
    const mainRef = useRef(null);
    const stickyInnerRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [stickyHeight, setStickyHeight] = useState(0);
    const [scrollElement, setScrollElement] = useState(null);
    const initialOffsetRef = useRef(null);
    const distanceRef = useRef(null);
    const progressRef = useRef(0);
    const hasSticky = Boolean(stickyContent || sticky);
    const primaryNode = useMemo(() => {
        if (primaryContent) {
            return primaryContent;
        }
        if (primary) {
            return renderPreset(primary, 'primary');
        }
        return null;
    }, [primaryContent, primary]);
    const stickyNode = useMemo(() => {
        if (!hasSticky) {
            return null;
        }
        if (stickyContent) {
            return stickyContent;
        }
        if (sticky) {
            return renderPreset(sticky, 'sticky');
        }
        return null;
    }, [hasSticky, stickyContent, sticky]);
    const updateStickyHeight = useCallback(() => {
        if (!hasSticky) {
            setStickyHeight(0);
            return;
        }
        const node = stickyInnerRef.current;
        if (!node) {
            return;
        }
        const { height } = node.getBoundingClientRect();
        setStickyHeight(height);
    }, [hasSticky]);
    const recomputeBaseline = useCallback((root) => {
        const main = mainRef.current;
        if (!main)
            return;
        const mainRect = main.getBoundingClientRect();
        const rootTop = root instanceof Window ? 0 : root.getBoundingClientRect().top;
        initialOffsetRef.current = mainRect.top - rootTop;
        const distance = transitionDistance ?? mainRect.height;
        distanceRef.current = distance > 0 ? distance : 1;
    }, [transitionDistance]);
    const updateProgress = useCallback((root) => {
        const main = mainRef.current;
        if (!main)
            return;
        const mainRect = main.getBoundingClientRect();
        const rootTop = root instanceof Window ? 0 : root.getBoundingClientRect().top;
        const currentTop = mainRect.top - rootTop;
        if (initialOffsetRef.current === null) {
            initialOffsetRef.current = currentTop;
        }
        if (distanceRef.current === null) {
            const distance = transitionDistance ?? mainRect.height;
            distanceRef.current = distance > 0 ? distance : 1;
        }
        const diff = (initialOffsetRef.current ?? 0) - currentTop;
        const distance = distanceRef.current ?? 1;
        const next = clamp01(distance === 0 ? 0 : diff / distance);
        if (Math.abs(next - progressRef.current) > PROGRESS_EPSILON) {
            progressRef.current = next;
            setProgress(next);
        }
    }, [transitionDistance]);
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const assignScrollElement = () => {
            const main = mainRef.current;
            if (!main)
                return;
            const provided = scrollContainerRef?.current;
            const resolved = provided ?? findScrollParent(main) ?? window;
            setScrollElement(prev => (prev === resolved ? prev : resolved));
        };
        const frame = window.requestAnimationFrame(assignScrollElement);
        return () => window.cancelAnimationFrame(frame);
    }, [scrollContainerRef]);
    useEffect(() => {
        if (typeof window === 'undefined' || !stickyNode) {
            return;
        }
        const observer = new ResizeObserver(updateStickyHeight);
        const node = stickyInnerRef.current;
        if (node) {
            observer.observe(node);
            updateStickyHeight();
        }
        return () => observer.disconnect();
    }, [stickyNode, updateStickyHeight]);
    useEffect(() => {
        if (typeof window === 'undefined' || !scrollElement) {
            return;
        }
        const root = scrollElement;
        const target = root instanceof Window ? window : root;
        const handleScroll = () => updateProgress(root);
        const handleResize = () => {
            recomputeBaseline(root);
            updateProgress(root);
            updateStickyHeight();
        };
        recomputeBaseline(root);
        updateProgress(root);
        updateStickyHeight();
        target.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);
        return () => {
            target.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [scrollElement, recomputeBaseline, updateProgress, updateStickyHeight]);
    useEffect(() => {
        if (typeof window === 'undefined' || !scrollElement) {
            return;
        }
        const main = mainRef.current;
        if (!main) {
            return;
        }
        if (typeof ResizeObserver === 'undefined') {
            return;
        }
        const observer = new ResizeObserver(() => {
            recomputeBaseline(scrollElement);
            updateProgress(scrollElement);
        });
        observer.observe(main);
        return () => observer.disconnect();
    }, [scrollElement, recomputeBaseline, updateProgress]);
    if (!primaryNode) {
        return null;
    }
    return (_jsxs("div", { className: cn('relative', className), children: [_jsx("div", { ref: mainRef, className: cn('relative transition-none will-change-[opacity,transform]', primaryClassName), style: {
                    opacity: 1 - progress,
                    transform: `translateY(-${progress * 32}px)`,
                    pointerEvents: progress >= 1 ? 'none' : 'auto',
                }, children: primaryNode }), stickyNode && (_jsx("div", { className: 'sticky z-30', style: {
                    top: typeof stickyOffset === 'number'
                        ? `${stickyOffset}px`
                        : stickyOffset,
                    height: stickyHeight,
                    marginTop: -stickyHeight,
                    pointerEvents: progress <= 0 ? 'none' : 'auto',
                }, children: _jsx("div", { ref: stickyInnerRef, className: cn('transition-none will-change-[opacity,transform]', stickyClassName), style: {
                        opacity: progress,
                        transform: `translateY(${(1 - progress) * 16}px)`,
                    }, children: stickyNode }) }))] }));
};
