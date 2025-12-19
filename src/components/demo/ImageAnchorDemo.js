import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Demo component to test all ImageAnchor positions
 * This is for testing purposes and can be used in development
 */
import { ImageAnchor } from '@/shared';
export const ImageAnchorDemo = () => {
    const anchors = [
        { anchor: ImageAnchor.TOP, label: 'Top' },
        { anchor: ImageAnchor.TOP_RIGHT, label: 'Top Right' },
        { anchor: ImageAnchor.RIGHT, label: 'Right' },
        { anchor: ImageAnchor.BOTTOM_RIGHT, label: 'Bottom Right' },
        { anchor: ImageAnchor.BOTTOM, label: 'Bottom' },
        { anchor: ImageAnchor.BOTTOM_LEFT, label: 'Bottom Left' },
        { anchor: ImageAnchor.LEFT, label: 'Left' },
        { anchor: ImageAnchor.TOP_LEFT, label: 'Top Left' },
        { anchor: ImageAnchor.CENTER, label: 'Center (Default)' },
    ];
    return (_jsxs("div", { className: 'p-8 space-y-8', children: [_jsx("h1", { className: 'text-3xl font-bold text-center mb-8', children: "Image Anchor Positions Demo" }), _jsx("div", { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', children: anchors.map(({ anchor, label }) => (_jsxs("div", { className: 'space-y-2', children: [_jsx("h3", { className: 'text-lg font-medium text-center', children: label }), _jsx("div", { className: 'h-48 w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-muted flex items-center justify-center', children: _jsxs("p", { className: 'text-sm text-muted-foreground', children: ["Placeholder for ", label] }) }), _jsxs("p", { className: 'text-sm text-gray-600 text-center', children: ["anchor=", anchor] })] }, anchor))) })] }));
};
