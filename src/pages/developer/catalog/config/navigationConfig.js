import { BookOpen, Info, Network, LayoutGrid, MousePointerClick, FormInput, Table, Eye, MessageSquare, Layout, Navigation, Search, Sparkles, } from 'lucide-react';
export const navigationGroups = [
    {
        label: 'Documentation',
        icon: BookOpen,
        items: [
            {
                id: 'overview',
                label: 'Overview',
                icon: Info,
                description: 'Component system philosophy',
            },
            {
                id: 'relationships',
                label: 'Relationships',
                icon: Network,
                description: 'Component architecture',
            },
        ],
    },
    {
        label: 'Components',
        icon: LayoutGrid,
        items: [
            {
                id: 'buttons',
                label: 'Buttons',
                icon: MousePointerClick,
                description: 'Action buttons',
            },
            {
                id: 'common-display',
                label: 'Cards & Display',
                icon: Info,
                description: 'Cards, badges, stats',
            },
            {
                id: 'data',
                label: 'Data',
                icon: Table,
                description: 'Tables and lists',
            },
            {
                id: 'display',
                label: 'Display',
                icon: Eye,
                description: 'Avatars and photos',
            },
            {
                id: 'feedback',
                label: 'Feedback',
                icon: MessageSquare,
                description: 'Toasts and spinners',
            },
            {
                id: 'forms',
                label: 'Form Inputs',
                icon: FormInput,
                description: 'Input components',
            },
            {
                id: 'common-forms',
                label: 'Form System',
                icon: FormInput,
                description: 'Complete form system',
            },
            {
                id: 'common-layout',
                label: 'Layout',
                icon: Layout,
                description: 'Grids and stacks',
            },
            {
                id: 'modals',
                label: 'Modals',
                icon: Layout,
                description: 'Dialogs and modals',
            },
            {
                id: 'navigation',
                label: 'Navigation',
                icon: Navigation,
                description: 'Navigation components',
            },
            {
                id: 'search',
                label: 'Search',
                icon: Search,
                description: 'Search dropdowns',
            },
            {
                id: 'misc',
                label: 'Miscellaneous',
                icon: Sparkles,
                description: 'Utility components',
            },
        ],
    },
];
