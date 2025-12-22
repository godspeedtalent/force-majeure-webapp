import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
export const ArtistRegistrationLayout = ({ children }) => {
    return (_jsxs("div", { className: 'min-h-screen bg-background flex flex-col relative overflow-hidden', children: [_jsx("div", { className: 'fixed inset-0 z-0', children: _jsx(TopographicBackground, { opacity: 0.35 }) }), _jsx(Navigation, {}), _jsx("main", { className: 'relative z-10 flex-1', children: children })] }));
};
