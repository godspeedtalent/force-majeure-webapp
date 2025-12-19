import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { FmI18nCommon } from '@/components/common/i18n';
import { cn } from '@/shared';
import { MoveVertical } from 'lucide-react';
export const HeroImageFocalPoint = ({ imageUrl, focalY, onChange, }) => {
    const { t } = useTranslation('common');
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current)
            return;
        updateFocalPoint(e.clientY);
    };
    const handleMouseDown = (e) => {
        setIsDragging(true);
        updateFocalPoint(e.clientY);
    };
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    const updateFocalPoint = (clientY) => {
        if (!containerRef.current)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const y = Math.round(((clientY - rect.top) / rect.height) * 100);
        // Clamp value between 0 and 100
        const clampedY = Math.max(0, Math.min(100, y));
        onChange(clampedY);
    };
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('mouseup', handleGlobalMouseUp);
            return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
        }
        return undefined;
    }, [isDragging]);
    if (!imageUrl) {
        return (_jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { children: t('focalPoint.label') }), _jsx("div", { className: 'flex items-center justify-center h-32 border border-dashed border-border rounded-lg bg-muted/20', children: _jsx(FmI18nCommon, { i18nKey: 'focalPoint.uploadToSet', as: 'p', className: 'text-sm text-muted-foreground' }) })] }));
    }
    return (_jsxs("div", { className: 'space-y-3', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx(Label, { children: t('focalPoint.label') }), _jsxs("span", { className: 'text-xs text-muted-foreground', children: [focalY, "%"] })] }), _jsxs("div", { ref: containerRef, className: cn('relative w-full h-48 rounded-lg overflow-hidden border border-border cursor-ns-resize', isDragging && 'ring-2 ring-fm-gold'), onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, children: [_jsx("img", { src: imageUrl, alt: t('focalPoint.heroImageAlt'), className: 'w-full h-full object-cover', draggable: false }), _jsxs("div", { className: 'absolute left-0 right-0 pointer-events-none transition-all duration-150', style: {
                            top: `${focalY}%`,
                        }, children: [_jsx("div", { className: 'h-0.5 bg-fm-gold shadow-[0_0_12px_rgba(255,215,0,0.8)]' }), _jsx("div", { className: 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center', children: _jsx("div", { className: 'bg-fm-gold rounded-full p-2 shadow-lg', children: _jsx(MoveVertical, { className: 'w-4 h-4 text-background' }) }) })] }), _jsxs("div", { className: 'absolute inset-0 pointer-events-none opacity-10', children: [_jsx("div", { className: 'absolute top-1/3 left-0 right-0 h-px bg-white' }), _jsx("div", { className: 'absolute top-2/3 left-0 right-0 h-px bg-white' })] })] }), _jsx(FmI18nCommon, { i18nKey: 'focalPoint.instructions', as: 'p', className: 'text-xs text-muted-foreground' })] }));
};
