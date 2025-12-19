import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { User, ShoppingCart, LogOut, Instagram } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '@/components/primitives/Breadcrumbs';
import { ForceMajeureLogo } from './ForceMajeureLogo';
import { Button } from '@/components/common/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, } from '@/components/common/shadcn/dropdown-menu';
import { useAuth } from '@/features/auth/services/AuthContext';
export const ScavengerNavigation = ({ showShoppingCart = true, }) => {
    const { user, signOut, profile } = useAuth();
    const navigate = useNavigate();
    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };
    return (_jsx("nav", { className: 'sticky top-0 z-50 w-full bg-background/50 backdrop-blur-md border-b border-border', children: _jsx("div", { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', children: _jsxs("div", { className: 'flex justify-between items-center h-16', children: [_jsxs("div", { className: 'flex items-center space-x-3', children: [_jsx(Link, { to: '/', className: 'transition-transform duration-200 hover:scale-110', children: _jsx(ForceMajeureLogo, { className: 'h-8 w-8' }) }), _jsx(Breadcrumbs, {})] }), _jsxs("div", { className: 'flex items-center space-x-4', children: [showShoppingCart && (_jsx(Button, { variant: 'ghost', size: 'sm', className: 'text-foreground hover:text-fm-gold hover:bg-hover-overlay', asChild: true, children: _jsx(Link, { to: '/merch', children: _jsx(ShoppingCart, { className: 'h-4 w-4' }) }) })), _jsx(Button, { variant: 'ghost', size: 'sm', className: 'text-foreground hover:text-fm-gold hover:bg-hover-overlay', asChild: true, children: _jsx("a", { href: 'https://www.instagram.com/force.majeure.events/', target: '_blank', rel: 'noopener noreferrer', "aria-label": 'Follow Force Majeure Events on Instagram', children: _jsx(Instagram, { className: 'h-4 w-4' }) }) }), user && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: 'ghost', size: 'sm', className: 'text-foreground hover:text-fm-gold hover:bg-hover-overlay', children: _jsx(User, { className: 'h-4 w-4' }) }) }), _jsxs(DropdownMenuContent, { align: 'end', className: 'w-56 bg-background border border-border shadow-lg z-50', children: [_jsx("div", { className: 'px-2 py-1.5 text-sm text-muted-foreground', children: profile?.display_name || 'User' }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { className: 'cursor-pointer hover:bg-hover-overlay text-destructive', onClick: handleSignOut, children: [_jsx(LogOut, { className: 'mr-2 h-4 w-4' }), _jsx("span", { children: "Sign Out" })] })] })] }))] })] }) }) }));
};
