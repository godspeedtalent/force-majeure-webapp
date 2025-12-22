import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Home, Shield, Database, Mail } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, } from '@/components/common/shadcn/context-menu';
export function DevNavigationTabContent({ onNavigate, isAdmin }) {
    const { t } = useTranslation('common');
    return (_jsxs("div", { className: 'space-y-4', children: [_jsx(Separator, { className: 'bg-white/10' }), _jsxs("div", { className: 'flex flex-col gap-4', children: [_jsxs("div", { className: 'flex flex-col gap-2', children: [isAdmin && (_jsxs(ContextMenu, { children: [_jsx(ContextMenuTrigger, { asChild: true, children: _jsx("div", { children: _jsx(FmCommonButton, { variant: 'default', icon: Shield, iconPosition: 'left', onClick: () => onNavigate('/admin/controls'), className: 'w-full justify-start', children: t('devNavigation.adminControls') }) }) }), _jsx(ContextMenuContent, { className: 'bg-card border-border rounded-none w-40', children: _jsx(ContextMenuItem, { onClick: () => onNavigate('/admin/controls'), className: 'text-white hover:bg-muted focus:bg-muted cursor-pointer', children: t('devNavigation.goTo') }) })] })), _jsxs(ContextMenu, { children: [_jsx(ContextMenuTrigger, { asChild: true, children: _jsx("div", { children: _jsx(FmCommonButton, { variant: 'default', icon: Home, iconPosition: 'left', onClick: () => onNavigate('/developer'), className: 'w-full justify-start', children: t('devNavigation.developerHome') }) }) }), _jsx(ContextMenuContent, { className: 'bg-card border-border rounded-none w-40', children: _jsx(ContextMenuItem, { onClick: () => onNavigate('/developer'), className: 'text-white hover:bg-muted focus:bg-muted cursor-pointer', children: t('devNavigation.goTo') }) })] })] }), _jsx(FmCommonCollapsibleSection, { title: t('devNavigation.supabase'), defaultExpanded: true, children: _jsxs("div", { className: 'flex flex-col gap-2', children: [_jsxs(ContextMenu, { children: [_jsx(ContextMenuTrigger, { asChild: true, children: _jsx("div", { children: _jsx(FmCommonButton, { variant: 'default', icon: Database, iconPosition: 'left', onClick: () => {
                                                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                                                        if (supabaseUrl) {
                                                            const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
                                                            if (isLocal) {
                                                                window.open('http://localhost:54323', '_blank');
                                                            }
                                                            else {
                                                                const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
                                                                if (projectRef) {
                                                                    window.open(`https://supabase.com/dashboard/project/${projectRef}`, '_blank');
                                                                }
                                                            }
                                                        }
                                                    }, className: 'w-full justify-start', children: t('devNavigation.supabaseDashboard') }) }) }), _jsx(ContextMenuContent, { className: 'bg-card border-border rounded-none w-40', children: _jsx(ContextMenuItem, { onClick: () => {
                                                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                                                    if (supabaseUrl) {
                                                        const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
                                                        if (isLocal) {
                                                            window.open('http://localhost:54323', '_blank');
                                                        }
                                                        else {
                                                            const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
                                                            if (projectRef) {
                                                                window.open(`https://supabase.com/dashboard/project/${projectRef}`, '_blank');
                                                            }
                                                        }
                                                    }
                                                }, className: 'text-white hover:bg-muted focus:bg-muted cursor-pointer', children: t('devNavigation.open') }) })] }), import.meta.env.VITE_ENVIRONMENT === 'dev' && (_jsx(FmCommonButton, { variant: 'default', icon: Mail, iconPosition: 'left', onClick: () => {
                                        window.open('http://localhost:55324', '_blank');
                                    }, className: 'w-full justify-start', children: t('devNavigation.mailpit') }))] }) })] })] }));
}
