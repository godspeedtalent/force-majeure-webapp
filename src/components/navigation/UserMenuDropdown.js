import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { LogOut, User as UserIcon, Building2, Scan, Database, Shield, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonDropdown, } from '@/components/common/forms/FmCommonDropdown';
import { FmUserAvatar } from '@/components/common/display/FmUserAvatar';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS, ROLES } from '@/shared';
import { AdminLockIndicator } from '@/components/common/indicators';
import { useIsMobile } from '@/shared';
import { cn } from '@/shared';
/**
 * User menu dropdown component for authenticated users
 * Shows fullscreen menu on mobile, dropdown on desktop
 */
export function UserMenuDropdown() {
    const { user, profile, signOut } = useAuth();
    const { hasPermission, hasRole, isAdmin } = useUserPermissions();
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = useState(false);
    const handleSignOut = async () => {
        setIsOpen(false);
        await signOut();
        navigate('/');
    };
    const handleNavigate = (path) => {
        setIsOpen(false);
        navigate(path);
    };
    // Org tools access: manage_organization permission
    const hasOrgToolsAccess = hasPermission(PERMISSIONS.MANAGE_ORGANIZATION);
    // Scanning access: scan_tickets permission
    const hasScanningAccess = hasPermission(PERMISSIONS.SCAN_TICKETS);
    // Any org access
    const hasAnyOrgAccess = hasOrgToolsAccess || hasScanningAccess;
    // Developer access
    const isDeveloper = hasRole(ROLES.DEVELOPER);
    // Admin access
    const isAdminUser = isAdmin();
    // Desktop dropdown sections - grouped by category
    const dropdownSections = [
        // Profile section (no header)
        {
            items: [
                {
                    label: t('nav.profile'),
                    icon: UserIcon,
                    onClick: () => navigate('/profile'),
                },
            ],
        },
        // Organization section (only if user has access)
        ...(hasAnyOrgAccess
            ? [
                {
                    label: t('nav.organization'),
                    items: [
                        ...(hasOrgToolsAccess
                            ? [
                                {
                                    label: t('nav.orgTools'),
                                    icon: Building2,
                                    onClick: () => navigate('/organization/tools'),
                                    badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.requiresAdminPermissions') }),
                                },
                            ]
                            : []),
                        ...(hasScanningAccess
                            ? [
                                {
                                    label: t('nav.scanning'),
                                    icon: Scan,
                                    onClick: () => navigate('/organization/scanning'),
                                    badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.requiresScanningPermissions') }),
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),
        // Developer section (only if user is developer)
        ...(isDeveloper
            ? [
                {
                    label: t('nav.developer'),
                    items: [
                        {
                            label: t('nav.database'),
                            icon: Database,
                            onClick: () => navigate('/developer/database'),
                            badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.developerOnly') }),
                        },
                    ],
                },
            ]
            : []),
        // Admin section (only if user is admin)
        ...(isAdminUser
            ? [
                {
                    label: t('nav.admin'),
                    items: [
                        {
                            label: t('nav.adminPanel'),
                            icon: Shield,
                            onClick: () => navigate('/admin/controls'),
                            badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.adminOnly') }),
                        },
                    ],
                },
            ]
            : []),
        // Site section
        {
            label: t('nav.site'),
            items: [
                {
                    label: t('nav.contactUs'),
                    icon: Mail,
                    onClick: () => navigate('/contact'),
                },
                {
                    label: t('nav.signOut'),
                    icon: LogOut,
                    onClick: handleSignOut,
                    variant: 'muted',
                },
            ],
        },
    ];
    // Mobile menu sections - grouped by category
    const mobileMenuSections = [
        // Profile section (no header)
        {
            items: [
                {
                    label: t('nav.profile'),
                    icon: UserIcon,
                    onClick: () => handleNavigate('/profile'),
                },
            ],
        },
        // Organization section (only if user has access)
        ...(hasAnyOrgAccess
            ? [
                {
                    label: t('nav.organization'),
                    items: [
                        ...(hasOrgToolsAccess
                            ? [
                                {
                                    label: t('nav.orgTools'),
                                    icon: Building2,
                                    onClick: () => handleNavigate('/organization/tools'),
                                    badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.requiresAdminPermissions') }),
                                },
                            ]
                            : []),
                        ...(hasScanningAccess
                            ? [
                                {
                                    label: t('nav.scanning'),
                                    icon: Scan,
                                    onClick: () => handleNavigate('/organization/scanning'),
                                    badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.requiresScanningPermissions') }),
                                },
                            ]
                            : []),
                    ],
                },
            ]
            : []),
        // Developer section (only if user is developer)
        ...(isDeveloper
            ? [
                {
                    label: t('nav.developer'),
                    items: [
                        {
                            label: t('nav.database'),
                            icon: Database,
                            onClick: () => handleNavigate('/developer/database'),
                            badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.developerOnly') }),
                        },
                    ],
                },
            ]
            : []),
        // Admin section (only if user is admin)
        ...(isAdminUser
            ? [
                {
                    label: t('nav.admin'),
                    items: [
                        {
                            label: t('nav.adminPanel'),
                            icon: Shield,
                            onClick: () => handleNavigate('/admin/controls'),
                            badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.adminOnly') }),
                        },
                    ],
                },
            ]
            : []),
        // Site section
        {
            label: t('nav.site'),
            items: [
                {
                    label: t('nav.contactUs'),
                    icon: Mail,
                    onClick: () => handleNavigate('/contact'),
                },
                {
                    label: t('nav.signOut'),
                    icon: LogOut,
                    onClick: handleSignOut,
                    variant: 'muted',
                },
            ],
        },
    ];
    // Mobile: Custom fullscreen overlay menu
    if (isMobile) {
        let itemIndex = 0; // Track global item index for striping
        return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: 'ghost', className: 'relative h-8 w-8 p-0 z-[101] hover:bg-transparent focus:bg-transparent group', onClick: () => setIsOpen(!isOpen), children: _jsx(FmUserAvatar, { avatarUrl: profile?.avatar_url, displayName: profile?.display_name || user?.user_metadata?.display_name, size: 'sm', className: 'transition-all duration-200 group-hover:ring-2 group-hover:ring-fm-gold group-hover:ring-offset-1 group-hover:ring-offset-background' }) }), isOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: 'fixed top-0 left-0 h-16 z-[99] pointer-events-none border-l-[3px] border-l-fm-gold/60', style: {
                                animation: 'borderSlideUp 200ms ease-out forwards',
                            }, children: _jsx("style", { children: `
                @keyframes borderSlideUp {
                  from {
                    clip-path: inset(100% 0 0 0);
                  }
                  to {
                    clip-path: inset(0 0 0 0);
                  }
                }
              ` }) }), _jsxs("div", { className: 'fixed inset-0 top-16 z-[100] animate-in fade-in duration-200', children: [_jsx("div", { className: 'absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer', onClick: () => setIsOpen(false) }), _jsxs("div", { className: cn('absolute top-0 left-0 right-0', 'bg-black/90 backdrop-blur-xl', 'border-b-2 border-white/20 border-l-[3px] border-l-fm-gold/60', 'shadow-lg shadow-black/50'), style: {
                                        transformOrigin: 'top',
                                        animation: 'menuSlideDown 200ms ease-out forwards',
                                    }, onClick: e => e.stopPropagation(), children: [_jsx("style", { children: `
                  @keyframes menuSlideDown {
                    from {
                      opacity: 0;
                      transform: scaleY(0.8) translateY(-10px);
                    }
                    to {
                      opacity: 1;
                      transform: scaleY(1) translateY(0);
                    }
                  }
                ` }), _jsxs("div", { className: 'flex items-center gap-[15px] p-[20px] border-b border-white/10', children: [_jsx(FmUserAvatar, { avatarUrl: profile?.avatar_url, displayName: profile?.display_name || user?.user_metadata?.display_name, size: 'md' }), _jsxs("div", { children: [_jsx("p", { className: 'font-canela font-medium text-white', children: profile?.display_name || user?.user_metadata?.display_name || t('nav.user') }), _jsx("p", { className: 'font-canela text-xs text-white/50', children: user?.email })] })] }), _jsx("div", { className: 'p-[10px]', children: mobileMenuSections.map((section, sectionIndex) => (_jsxs("div", { children: [sectionIndex > 0 && (_jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-[10px]' })), section.label && (_jsx("div", { className: 'px-[15px] py-[8px]', children: _jsx("p", { className: 'font-canela text-[10px] uppercase tracking-[0.2em] text-fm-gold/70', children: section.label }) })), section.items.map((item, _itemIdx) => {
                                                        const currentIndex = itemIndex++;
                                                        const isEven = currentIndex % 2 === 0;
                                                        return (_jsxs("button", { onClick: item.onClick, className: cn('w-full flex items-center gap-[15px] px-[15px] py-[12px] rounded-none my-0.5', 'group cursor-pointer relative', 
                                                            // Use transparent backgrounds to let frosted glass show through
                                                            isEven ? 'bg-white/[0.02]' : 'bg-white/[0.06]', 'hover:bg-fm-gold/15 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white', 'focus:bg-fm-gold/20 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/20 focus:text-white', 'active:scale-[0.98] transition-all duration-300', item.variant === 'muted' &&
                                                                'text-white/70 hover:bg-white/10 hover:shadow-white/10 focus:bg-white/15 focus:shadow-white/10 hover:text-white'), children: [_jsx("span", { className: 'transition-transform duration-300 group-hover:scale-110', children: _jsx(item.icon, { className: 'h-5 w-5' }) }), _jsxs("span", { className: 'flex items-center flex-1 font-canela font-medium text-base', children: [item.label, item.badge && _jsx("span", { className: 'ml-auto', children: item.badge })] })] }, item.label));
                                                    })] }, sectionIndex))) })] })] })] }))] }));
    }
    // Desktop: Standard dropdown with sections
    return (_jsx(FmCommonDropdown, { trigger: _jsx(Button, { variant: 'ghost', className: 'relative h-8 w-8 p-0 hover:bg-transparent focus:bg-transparent group', children: _jsx(FmUserAvatar, { avatarUrl: profile?.avatar_url, displayName: profile?.display_name || user?.user_metadata?.display_name, size: 'sm', className: 'transition-all duration-200 group-hover:ring-2 group-hover:ring-fm-gold group-hover:ring-offset-1 group-hover:ring-offset-background' }) }), sections: dropdownSections, hideChevron: true }));
}
