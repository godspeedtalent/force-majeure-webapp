import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { MobileBottomTabBar } from '@/components/mobile';
import { Sliders, Settings, Code, Shield, DollarSign, Users, Database, Building2, Activity, ClipboardList, } from 'lucide-react';
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminTicketingSection } from '@/components/admin/AdminTicketingSection';
import { DevToolsManagement } from '@/components/admin/DevToolsManagement';
import { UserManagement } from './UserManagement';
import { OrganizationsManagement } from './OrganizationsManagement';
import { UserRequestsAdmin } from '@/components/admin/UserRequestsAdmin';
import { formatHeader } from '@/shared';
export default function AdminControls() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('settings');
    // Handle tab changes - some tabs navigate to external pages
    const handleTabChange = useCallback((tab) => {
        if (tab === 'logs') {
            navigate('/admin/logs');
        }
        else {
            setActiveTab(tab);
        }
    }, [navigate]);
    // Navigation groups configuration - Alphabetically sorted
    const navigationGroups = [
        {
            label: 'Site Controls',
            icon: Shield,
            items: [
                {
                    id: 'devtools',
                    label: 'Developer Tools',
                    icon: Code,
                    description: 'Toggle dev environment features',
                },
                {
                    id: 'ticketing',
                    label: 'Ticketing',
                    icon: DollarSign,
                    description: 'Configure ticketing fees and checkout behavior',
                },
                {
                    id: 'settings',
                    label: 'Site Settings',
                    icon: Sliders,
                    description: 'Configure site settings',
                },
            ],
        },
        {
            label: 'Database',
            icon: Database,
            items: [
                {
                    id: 'organizations',
                    label: 'Organizations',
                    icon: Building2,
                    description: 'Manage organizations',
                },
                {
                    id: 'requests',
                    label: 'User Requests',
                    icon: ClipboardList,
                    description: 'Review user requests',
                },
                {
                    id: 'users',
                    label: 'Users',
                    icon: Users,
                    description: 'Manage user accounts',
                },
            ],
        },
        {
            label: 'Monitoring',
            icon: Activity,
            items: [
                {
                    id: 'logs',
                    label: 'Activity Logs',
                    icon: Activity,
                    description: 'View system activity logs',
                    isExternal: true,
                },
            ],
        },
    ];
    // Mobile bottom tabs configuration
    const mobileTabs = [
        { id: 'devtools', label: 'Dev Tools', icon: Code },
        { id: 'ticketing', label: 'Ticketing', icon: DollarSign },
        { id: 'settings', label: 'Settings', icon: Sliders },
        { id: 'organizations', label: 'Orgs', icon: Building2 },
        { id: 'requests', label: 'Requests', icon: ClipboardList },
        { id: 'users', label: 'Users', icon: Users },
    ];
    const getTabTitle = () => {
        if (activeTab === 'settings')
            return 'Site Settings';
        if (activeTab === 'devtools')
            return 'Developer Tools';
        if (activeTab === 'ticketing')
            return 'Ticketing';
        if (activeTab === 'users')
            return 'Users';
        if (activeTab === 'organizations')
            return 'Organizations';
        if (activeTab === 'requests')
            return 'User Requests';
        return 'Admin Controls';
    };
    return (_jsx(SideNavbarLayout, { navigationGroups: navigationGroups, activeItem: activeTab, onItemChange: handleTabChange, mobileTabBar: _jsx(MobileBottomTabBar, { tabs: mobileTabs, activeTab: activeTab, onTabChange: tab => handleTabChange(tab) }), children: _jsxs("div", { className: 'max-w-full', children: [_jsx("div", { className: 'mb-[20px]', children: _jsxs("div", { className: 'flex items-center gap-[10px] mb-[20px]', children: [_jsx(Settings, { className: 'h-6 w-6 text-fm-gold' }), _jsx("h1", { className: 'text-3xl font-canela', children: formatHeader(getTabTitle()) })] }) }), _jsx(DecorativeDivider, { marginTop: 'mt-0', marginBottom: 'mb-6', lineWidth: 'w-32', opacity: 0.5 }), activeTab === 'settings' && (_jsx("div", { className: 'space-y-8', children: _jsxs("div", { children: [_jsx("h3", { className: 'text-lg font-canela font-semibold mb-2', children: formatHeader('Feature Flags') }), _jsx("p", { className: 'text-muted-foreground text-sm mb-4', children: "Control feature availability across different environments" }), _jsx(FeatureToggleSection, {})] }) })), activeTab === 'ticketing' && (_jsx("div", { className: 'space-y-6', children: _jsxs("div", { children: [_jsx("p", { className: 'text-muted-foreground text-sm mb-4', children: "Configure checkout timer and fees applied to all ticket purchases" }), _jsx(AdminTicketingSection, {})] }) })), activeTab === 'users' && (_jsx("div", { className: 'space-y-6', children: _jsxs("div", { children: [_jsx("p", { className: 'text-muted-foreground text-sm mb-4', children: "Manage user accounts, roles, and permissions" }), _jsx(UserManagement, {})] }) })), activeTab === 'organizations' && (_jsx("div", { className: 'space-y-6', children: _jsxs("div", { children: [_jsx("p", { className: 'text-muted-foreground text-sm mb-4', children: "Manage organizations and their settings" }), _jsx(OrganizationsManagement, {})] }) })), activeTab === 'requests' && (_jsx("div", { className: 'space-y-6', children: _jsxs("div", { children: [_jsx("p", { className: 'text-muted-foreground text-sm mb-4', children: "Review and manage user requests for artist linking, data deletion, and more." }), _jsx(UserRequestsAdmin, {})] }) })), activeTab === 'devtools' && (_jsx("div", { className: 'space-y-6', children: _jsxs("div", { children: [_jsx("h3", { className: 'text-lg font-canela font-semibold mb-2', children: formatHeader('Dev Toolbar Sections') }), _jsx("p", { className: 'text-muted-foreground text-sm mb-4', children: "Control which sections appear in the developer toolbar for testing" }), _jsx(DevToolsManagement, {})] }) }))] }) }));
}
