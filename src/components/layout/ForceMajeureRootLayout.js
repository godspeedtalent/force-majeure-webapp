import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Footer } from '@/components/navigation/Footer';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
export const ForceMajeureRootLayout = ({ children, className = '', }) => {
    return (_jsxs("div", { className: `min-h-screen bg-background flex flex-col ${className}`, children: [_jsx(Navigation, {}), _jsxs("div", { className: 'flex-1 relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsx("div", { className: 'relative pb-20', children: children })] }), _jsx("div", { className: 'fixed bottom-0 left-0 right-0 z-40', children: _jsx(Footer, {}) })] }));
};
export default ForceMajeureRootLayout;
