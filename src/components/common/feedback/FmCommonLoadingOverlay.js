import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
/**
 * A reusable loading overlay component that displays a spinner and optional message
 * Covers the entire viewport with a backdrop blur effect
 */
export function FmCommonLoadingOverlay({ message, }) {
    return (_jsx("div", { className: 'fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300', children: _jsxs("div", { className: 'flex flex-col items-center gap-4', children: [_jsx(FmCommonLoadingSpinner, { size: 'lg' }), message && _jsx("p", { className: 'text-white/70 text-sm', children: message })] }) }));
}
