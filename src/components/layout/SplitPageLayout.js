import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Footer } from '@/components/navigation/Footer';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
export const SplitPageLayout = ({ left, right, leftWidthClass = 'w-full lg:w-1/4', rightWidthClass = 'hidden lg:block w-3/4', leftDecor = true, className = '', }) => {
    return (_jsxs("div", { className: `min-h-screen bg-background flex flex-col ${className}`, children: [_jsx(Navigation, {}), _jsxs("div", { className: 'flex-1 flex min-h-[calc(100vh-160px)]', children: [_jsxs("div", { className: `${leftWidthClass} relative overflow-hidden`, children: [leftDecor && (_jsxs(_Fragment, { children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' })] })), _jsx("div", { className: 'relative h-full', children: _jsx("div", { className: 'mx-auto w-full max-w-[500px] h-full', children: left }) })] }), _jsx("div", { className: `${rightWidthClass} bg-muted/30 border-l border-border overflow-y-auto`, children: _jsx("div", { className: 'h-[calc(100vh-160px)] pb-20', children: right }) })] }), _jsx("div", { className: 'fixed bottom-0 left-0 right-0 z-40', children: _jsx(Footer, {}) })] }));
};
export default SplitPageLayout;
