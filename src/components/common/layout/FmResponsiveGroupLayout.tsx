import { useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn, useIsMobile } from '@/shared';
import {
  FmCollapsibleGroupHeader,
  FmCollapsibleSubgroupHeader,
} from '@/components/common/data/FmCollapsibleGroupHeader';
import {
  MobileHorizontalTabs,
  MobileHorizontalTab,
} from '@/components/mobile/MobileHorizontalTabs';

/**
 * Defines a subgroup (H2 level) within a main group
 * On mobile, these are flattened into simple section headers
 */
export interface ResponsiveSubgroup {
  /** Unique identifier within parent group */
  id: string;
  /** Display title for the subgroup header */
  title: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Content to render */
  children: ReactNode;
  /** Optional count to display */
  count?: number;
  /** Whether subgroup starts expanded on desktop (default: true) */
  defaultExpanded?: boolean;
}

/**
 * Defines a group that renders as collapsible section (desktop) or tab (mobile)
 */
export interface ResponsiveGroup {
  /** Unique identifier for the group */
  id: string;
  /** Display title for the group header/tab */
  title: string;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Content to render inside the group */
  children: ReactNode;
  /** Optional count to display (desktop only) */
  count?: number;
  /** Whether the group starts expanded on desktop (default: true) */
  defaultExpanded?: boolean;
  /** Nested subgroups (H2 level) - collapsible on desktop, flattened on mobile */
  subgroups?: ResponsiveSubgroup[];
}

export interface FmResponsiveGroupLayoutProps {
  /** Array of groups to render */
  groups: ResponsiveGroup[];
  /** Additional class name for the container */
  className?: string;
  /** Default active tab ID for mobile (defaults to first group) */
  defaultActiveTab?: string;
  /** Controlled active tab state */
  activeTab?: string;
  /** Callback when active tab changes (mobile) */
  onActiveTabChange?: (tabId: string) => void;
  /** Whether to show dividers between groups on desktop (default: true) */
  showDividers?: boolean;
  /** Size variant for desktop headers */
  desktopSize?: 'default' | 'large';
  /** Class name for mobile tab content container */
  mobileContentClassName?: string;
}

/**
 * FmResponsiveGroupLayout - Responsive layout that adapts to device
 *
 * - Desktop: Renders groups as collapsible FmCollapsibleGroupHeader sections
 * - Mobile: Renders groups as horizontal tabs with content switching
 *
 * Subgroups (H2 level) are rendered as nested collapsible headers on desktop,
 * and flattened to simple section headers on mobile for cleaner UX.
 *
 * @example
 * ```tsx
 * const groups: ResponsiveGroup[] = [
 *   {
 *     id: 'settings',
 *     title: 'Settings',
 *     icon: Settings,
 *     children: <SettingsContent />,
 *     subgroups: [
 *       { id: 'general', title: 'General', children: <GeneralSettings /> },
 *       { id: 'advanced', title: 'Advanced', children: <AdvancedSettings /> },
 *     ],
 *   },
 * ];
 *
 * <FmResponsiveGroupLayout groups={groups} />
 * ```
 */
export const FmResponsiveGroupLayout = ({
  groups,
  className,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  showDividers = true,
  desktopSize = 'default',
  mobileContentClassName,
}: FmResponsiveGroupLayoutProps) => {
  const isMobile = useIsMobile();
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab || groups[0]?.id || ''
  );

  // Use controlled state if provided
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onActiveTabChange?.(tabId);
  };

  // Handle undefined isMobile during SSR/initial render
  if (isMobile === undefined) {
    return null;
  }

  // Mobile: Render as horizontal tabs
  if (isMobile) {
    const mobileTabs: MobileHorizontalTab[] = groups.map(group => ({
      id: group.id,
      label: group.title,
      icon: group.icon,
    }));

    const activeGroup = groups.find(g => g.id === activeTab);

    return (
      <div className={cn('flex flex-col', className)}>
        <MobileHorizontalTabs
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        {/* Tab content */}
        <div className={cn('flex-1 py-4', mobileContentClassName)}>
          {activeGroup?.children}
          {/* Render subgroups as flattened section headers */}
          {activeGroup?.subgroups?.map((subgroup, index) => (
            <MobileSubgroupSection key={subgroup.id} subgroup={subgroup} isFirst={index === 0 && !activeGroup.children} />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: Render as collapsible groups
  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((group, index) => (
        <FmCollapsibleGroupHeader
          key={group.id}
          title={group.title}
          icon={group.icon}
          count={group.count}
          defaultExpanded={group.defaultExpanded}
          showDivider={showDividers && index < groups.length - 1}
          size={desktopSize}
        >
          {group.children}
          {/* Render subgroups as nested collapsible headers */}
          {group.subgroups?.map(subgroup => (
            <FmCollapsibleSubgroupHeader
              key={subgroup.id}
              title={subgroup.title}
              icon={subgroup.icon}
              count={subgroup.count}
              defaultExpanded={subgroup.defaultExpanded}
              className="mt-2"
            >
              {subgroup.children}
            </FmCollapsibleSubgroupHeader>
          ))}
        </FmCollapsibleGroupHeader>
      ))}
    </div>
  );
};

/**
 * Mobile subgroup section - renders as simple section header (non-collapsible)
 */
interface MobileSubgroupSectionProps {
  subgroup: ResponsiveSubgroup;
  isFirst?: boolean;
}

const MobileSubgroupSection = ({ subgroup, isFirst = false }: MobileSubgroupSectionProps) => {
  const Icon = subgroup.icon;

  return (
    <div className={cn('first:mt-0', !isFirst && 'mt-6')}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        {Icon && <Icon className="h-4 w-4 text-fm-gold" />}
        <span className="text-xs font-medium uppercase tracking-wider text-white/60">
          {subgroup.title}
        </span>
        {subgroup.count !== undefined && (
          <span className="text-xs text-white/30">({subgroup.count})</span>
        )}
      </div>
      {/* Section content */}
      {subgroup.children}
    </div>
  );
};
