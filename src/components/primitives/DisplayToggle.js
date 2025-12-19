import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Grid, List } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
export const DisplayToggle = ({ displayMode, onDisplayModeChange, }) => {
    return (_jsxs("div", { className: 'flex items-center gap-1 rounded-md p-1', children: [_jsx(Button, { variant: displayMode === 'grid' ? 'default' : 'ghost', size: 'sm', onClick: () => onDisplayModeChange('grid'), className: 'h-8 w-8 p-0', children: _jsx(Grid, { className: 'h-4 w-4' }) }), _jsx(Button, { variant: displayMode === 'row' ? 'default' : 'ghost', size: 'sm', onClick: () => onDisplayModeChange('row'), className: 'h-8 w-8 p-0', children: _jsx(List, { className: 'h-4 w-4' }) })] }));
};
