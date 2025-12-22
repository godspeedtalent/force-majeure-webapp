import { jsx as _jsx } from "react/jsx-runtime";
import { FileText, Users, Ticket, DollarSign, ShoppingBag, Calendar, BarChart3, Shield, Link2, Eye, Share2, Palette, } from 'lucide-react';
import { AdminLockIndicator } from '@/components/common/indicators';
export function getEventNavigationConfig(isAdmin, t) {
    const navigationGroups = [
        {
            label: t('eventNav.eventDetails'),
            icon: Calendar,
            items: [
                {
                    id: 'view',
                    label: t('eventNav.viewEvent'),
                    icon: Eye,
                    description: t('eventNav.viewEventDescription'),
                },
                {
                    id: 'overview',
                    label: t('eventNav.overview'),
                    icon: FileText,
                    description: t('eventNav.overviewDescription'),
                },
                {
                    id: 'artists',
                    label: t('eventNav.artists'),
                    icon: Users,
                    description: t('eventNav.artistsDescription'),
                },
                {
                    id: 'social',
                    label: t('eventNav.social'),
                    icon: Share2,
                    description: t('eventNav.socialDescription'),
                },
                {
                    id: 'ux_display',
                    label: t('eventNav.uxDisplay'),
                    icon: Palette,
                    description: t('eventNav.uxDisplayDescription'),
                },
            ],
        },
        {
            label: t('eventNav.ticketing'),
            icon: Ticket,
            items: [
                {
                    id: 'tiers',
                    label: t('eventNav.ticketTiers'),
                    icon: Ticket,
                    description: t('eventNav.ticketTiersDescription'),
                },
                {
                    id: 'orders',
                    label: t('eventNav.orders'),
                    icon: ShoppingBag,
                    description: t('eventNav.ordersDescription'),
                },
                {
                    id: 'tracking',
                    label: t('eventNav.trackingLinks'),
                    icon: Link2,
                    description: t('eventNav.trackingLinksDescription'),
                },
            ],
        },
        {
            label: t('eventNav.analytics'),
            icon: BarChart3,
            items: [
                {
                    id: 'sales',
                    label: t('eventNav.salesSummary'),
                    icon: DollarSign,
                    description: t('eventNav.salesSummaryDescription'),
                },
                {
                    id: 'reports',
                    label: t('eventNav.reports'),
                    icon: FileText,
                    description: t('eventNav.reportsDescription'),
                },
            ],
        },
        ...(isAdmin
            ? [
                {
                    label: t('eventNav.admin'),
                    icon: Shield,
                    items: [
                        {
                            id: 'admin',
                            label: t('eventNav.adminControls'),
                            icon: Shield,
                            description: t('eventNav.adminControlsDescription'),
                            badge: (_jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: t('nav.adminOnly') })),
                        },
                    ],
                },
            ]
            : []),
    ];
    const mobileTabs = [
        { id: 'view', label: t('eventNav.mobile.view'), icon: Eye },
        { id: 'overview', label: t('eventNav.mobile.overview'), icon: FileText },
        { id: 'artists', label: t('eventNav.mobile.artists'), icon: Users },
        { id: 'social', label: t('eventNav.mobile.social'), icon: Share2 },
        { id: 'ux_display', label: t('eventNav.mobile.ux'), icon: Palette },
        { id: 'tiers', label: t('eventNav.mobile.tiers'), icon: Ticket },
        { id: 'orders', label: t('eventNav.mobile.orders'), icon: ShoppingBag },
        { id: 'tracking', label: t('eventNav.mobile.links'), icon: Link2 },
        { id: 'sales', label: t('eventNav.mobile.sales'), icon: DollarSign },
        { id: 'reports', label: t('eventNav.mobile.reports'), icon: FileText },
        ...(isAdmin ? [{ id: 'admin', label: t('eventNav.mobile.admin'), icon: Shield }] : []),
    ];
    return { navigationGroups, mobileTabs };
}
