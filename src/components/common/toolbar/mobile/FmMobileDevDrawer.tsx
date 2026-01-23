import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/common/shadcn/drawer';
import {
  Compass,
  Database,
  ToggleLeft,
  ClipboardList,
  UserCog,
  Info,
  AlertTriangle,
  Inbox,
  ShoppingCart,
  Building2,
  Scan,
  ChevronDown,
  ChevronRight,
  Video,
} from 'lucide-react';
import { cn } from '@/shared';
import { MobileDevToolId } from './useMobileDevTools';

interface FmMobileDevDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolSelect: (toolId: MobileDevToolId) => void;
  badges: Record<MobileDevToolId, number>;
  /** Whether user has full dev tools access (admin/developer) or just staff tools */
  canAccessDevTools: boolean;
  /** Whether user is admin */
  isAdmin: boolean;
  /** Whether user has organization access */
  hasOrgAccess: boolean;
  /** Whether user is logged in and has cart items */
  hasCartItems: boolean;
}

interface ToolConfig {
  id: MobileDevToolId;
  label: string;
  icon: React.ReactNode;
  /** If true, only visible to admin/developer roles */
  devOnly?: boolean;
  /** If true, only visible to admin */
  adminOnly?: boolean;
  /** If true, requires organization access */
  orgOnly?: boolean;
  /** If true, requires cart items */
  cartOnly?: boolean;
}

interface ToolGroup {
  id: string;
  label: string;
  tools: ToolConfig[];
  /** Default expanded state */
  defaultExpanded?: boolean;
}

interface ToolCardProps {
  id: MobileDevToolId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick: () => void;
}

function ToolCard({ label, icon, badge, onClick }: ToolCardProps) {
  const hasBadge = badge !== undefined && badge > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styling
        'relative',
        'bg-white/5 border border-white/10',
        // Sharp corners per design system
        'rounded-none',
        // Spacing - MD padding
        'p-[20px]',
        // Layout - flex column for icon + label
        'flex flex-col items-center justify-center',
        'gap-[10px]',
        // Min height for consistency
        'min-h-[100px]',
        // Hover states
        'hover:bg-white/10 hover:border-fm-gold/50',
        // Active state
        'active:scale-95',
        // Transitions
        'transition-all duration-200',
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-fm-gold/50'
      )}
      type="button"
    >
      {/* Icon */}
      <div className="text-fm-gold">{icon}</div>

      {/* Label */}
      <span className="text-sm font-canela uppercase text-white">{label}</span>

      {/* Badge */}
      {hasBadge && (
        <span
          className={cn(
            // Position - top-right corner
            'absolute top-[5px] right-[5px]',
            // Size
            'min-w-[20px] h-[20px]',
            // Styling
            'bg-fm-danger text-white',
            // Shape
            'rounded-full',
            // Typography
            'text-[10px] font-bold',
            // Layout
            'flex items-center justify-center',
            // Padding
            'px-[5px]',
            // Border
            'border border-black'
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

interface CollapsibleGroupProps {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  totalBadges?: number;
}

function CollapsibleGroup({
  label,
  isExpanded,
  onToggle,
  children,
  totalBadges = 0,
}: CollapsibleGroupProps) {
  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Group Header */}
      <button
        onClick={onToggle}
        type="button"
        className={cn(
          'w-full flex items-center justify-between',
          'px-[15px] py-[10px]',
          'hover:bg-white/5',
          'transition-all duration-200'
        )}
      >
        <div className="flex items-center gap-[10px]">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-fm-gold" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span
            className={cn(
              'text-xs font-canela uppercase tracking-wider',
              isExpanded ? 'text-fm-gold' : 'text-muted-foreground'
            )}
          >
            {label}
          </span>
        </div>
        {totalBadges > 0 && (
          <span
            className={cn(
              'min-w-[18px] h-[18px]',
              'bg-fm-danger text-white',
              'rounded-full',
              'text-[9px] font-bold',
              'flex items-center justify-center',
              'px-[4px]'
            )}
          >
            {totalBadges > 99 ? '99+' : totalBadges}
          </span>
        )}
      </button>

      {/* Group Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="p-[10px] pt-0">{children}</div>
      </div>
    </div>
  );
}

/**
 * Main tool selection drawer for mobile developer toolbar
 * Displays grid of available developer tools with badges
 * Uses Vaul drawer for native mobile bottom sheet behavior
 * Now includes collapsible groups for better organization
 */
export function FmMobileDevDrawer({
  open,
  onOpenChange,
  onToolSelect,
  badges,
  canAccessDevTools,
  isAdmin,
  hasOrgAccess,
  hasCartItems,
}: FmMobileDevDrawerProps) {
  const { t } = useTranslation('common');

  // Track expanded groups - default some to expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['staff', 'dataConfig'])
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Define all tool groups with their tools
  const allGroups: ToolGroup[] = [
    // User tools (cart) - visible to logged in users with cart items
    {
      id: 'user',
      label: t('mobileDevTools.groups.user'),
      defaultExpanded: true,
      tools: [
        {
          id: 'cart',
          label: t('mobileDevTools.tools.cart'),
          icon: <ShoppingCart className="h-[24px] w-[24px]" strokeWidth={2} />,
          cartOnly: true,
        },
      ],
    },
    // Admin tools
    {
      id: 'admin',
      label: t('mobileDevTools.groups.admin'),
      defaultExpanded: true,
      tools: [
        {
          id: 'adminMessages',
          label: t('mobileDevTools.tools.adminMessages'),
          icon: <Inbox className="h-[24px] w-[24px]" strokeWidth={2} />,
          adminOnly: true,
        },
      ],
    },
    // Organization tools
    {
      id: 'organization',
      label: t('mobileDevTools.groups.organization'),
      defaultExpanded: true,
      tools: [
        {
          id: 'orgDashboard',
          label: t('mobileDevTools.tools.orgDashboard'),
          icon: <Building2 className="h-[24px] w-[24px]" strokeWidth={2} />,
          orgOnly: true,
        },
        {
          id: 'scanTickets',
          label: t('mobileDevTools.tools.scanTickets'),
          icon: <Scan className="h-[24px] w-[24px]" strokeWidth={2} />,
          orgOnly: true,
        },
      ],
    },
    // Staff tools
    {
      id: 'staff',
      label: t('mobileDevTools.groups.staff'),
      defaultExpanded: true,
      tools: [
        {
          id: 'navigation',
          label: t('mobileDevTools.tools.navigation'),
          icon: <Compass className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: false, // Staff can access
        },
        {
          id: 'notes',
          label: t('mobileDevTools.tools.staffNotes'),
          icon: <ClipboardList className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: false, // Staff can access
        },
      ],
    },
    // Developer tools
    {
      id: 'developer',
      label: t('mobileDevTools.groups.developer'),
      defaultExpanded: false,
      tools: [
        {
          id: 'pageInfo',
          label: t('mobileDevTools.tools.pageInfo'),
          icon: <Info className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: true,
        },
        {
          id: 'roles',
          label: t('mobileDevTools.tools.roles'),
          icon: <UserCog className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: true,
        },
        {
          id: 'demoMode',
          label: t('mobileDevTools.tools.demoMode'),
          icon: <Video className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: true,
        },
      ],
    },
    // Data & Config tools
    {
      id: 'dataConfig',
      label: t('mobileDevTools.groups.dataConfig'),
      defaultExpanded: true,
      tools: [
        {
          id: 'database',
          label: t('mobileDevTools.tools.database'),
          icon: <Database className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: true,
        },
        {
          id: 'features',
          label: t('mobileDevTools.tools.features'),
          icon: <ToggleLeft className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: true,
        },
        {
          id: 'errorLogs',
          label: t('mobileDevTools.tools.errorLogs'),
          icon: <AlertTriangle className="h-[24px] w-[24px]" strokeWidth={2} />,
          devOnly: true,
        },
      ],
    },
  ];

  // Filter groups and tools based on access level
  const visibleGroups = allGroups
    .map(group => {
      const visibleTools = group.tools.filter(tool => {
        // Check dev-only access
        if (tool.devOnly && !canAccessDevTools) return false;
        // Check admin-only access
        if (tool.adminOnly && !isAdmin) return false;
        // Check org access
        if (tool.orgOnly && !hasOrgAccess) return false;
        // Check cart items
        if (tool.cartOnly && !hasCartItems) return false;
        return true;
      });

      return {
        ...group,
        tools: visibleTools,
      };
    })
    .filter(group => group.tools.length > 0);

  // Calculate total badges per group
  const getGroupBadges = (group: ToolGroup): number => {
    return group.tools.reduce((sum, tool) => sum + (badges[tool.id] || 0), 0);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          // Background - frosted glass Level 2
          'bg-black/80 backdrop-blur-lg',
          // Border - white subtle
          'border-t-2 border-white/20',
          // Rounded top corners (bottom sheet convention)
          'rounded-t-[20px]',
          // Max height - 80vh to show content behind
          'max-h-[80vh]',
          // z-index - above FAB
          'z-[70]'
        )}
      >
        {/* Header with drag handle */}
        <DrawerHeader className="pb-[10px]">
          {/* Drag Handle */}
          <div className="mx-auto h-[4px] w-[100px] rounded-full bg-fm-gold/50 mb-[20px]" />

          <DrawerTitle className="text-center font-canela uppercase text-fm-gold text-lg">
            {t('mobileDevTools.title')}
          </DrawerTitle>
        </DrawerHeader>

        {/* Scrollable Groups */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] px-[15px] pb-[20px]">
          <div className="space-y-[10px]">
            {visibleGroups.map(group => (
              <CollapsibleGroup
                key={group.id}
                label={group.label}
                isExpanded={expandedGroups.has(group.id)}
                onToggle={() => toggleGroup(group.id)}
                totalBadges={getGroupBadges(group)}
              >
                <div
                  className={cn(
                    // Responsive grid - 2 cols on small, 3 cols on larger mobile
                    'grid grid-cols-2 sm:grid-cols-3',
                    // Gap - SM spacing
                    'gap-[10px]'
                  )}
                >
                  {group.tools.map(tool => (
                    <ToolCard
                      key={tool.id}
                      id={tool.id}
                      label={tool.label}
                      icon={tool.icon}
                      badge={badges[tool.id]}
                      onClick={() => {
                        onToolSelect(tool.id);
                      }}
                    />
                  ))}
                </div>
              </CollapsibleGroup>
            ))}
          </div>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </DrawerContent>
    </Drawer>
  );
}
