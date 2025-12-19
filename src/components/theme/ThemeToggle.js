import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Button } from '@/components/common/shadcn/button';
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    return (_jsxs(Button, { variant: 'ghost', size: 'sm', onClick: () => setTheme(theme === 'light' ? 'dark' : 'light'), className: 'text-foreground hover:text-fm-gold hover:bg-hover-overlay transition-colors duration-200', children: [_jsx(Sun, { className: 'h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' }), _jsx(Moon, { className: 'absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' }), _jsx("span", { className: 'sr-only', children: "Toggle theme" })] }));
}
