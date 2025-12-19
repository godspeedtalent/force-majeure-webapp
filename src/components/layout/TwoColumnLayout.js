import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { cn } from '@/shared';
export const TwoColumnLayout = ({ left, right, leftDecor = true, rightImage, border = true, className, }) => {
    return (_jsxs("div", { className: cn('min-h-screen flex', className), children: [_jsxs("div", { className: cn('w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)]', border && 'border-r border-border'), children: [leftDecor && (_jsxs(_Fragment, { children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' })] })), _jsx("div", { className: 'w-full max-w-3xl px-8 py-12 relative z-10', children: left })] }), _jsx("div", { className: 'w-1/2 bg-muted relative overflow-hidden', children: rightImage ? (_jsxs(_Fragment, { children: [_jsx(ImageWithSkeleton, { src: rightImage, alt: 'Background', className: 'w-full h-full object-cover brightness-90' }), _jsx("div", { className: 'absolute inset-0 bg-background/5 backdrop-blur-[0.5px]' }), _jsx("div", { className: 'absolute inset-0 bg-black/[0.03]' })] })) : (right) })] }));
};
