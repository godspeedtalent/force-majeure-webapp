/**
 * Artist Screening Dashboard
 *
 * Main dashboard for FM staff to review and approve artist DJ set submissions.
 * Features:
 * - Queues tab: View submissions with filtering and sorting
 * - Analytics tab: View rankings and reviewer leaderboards
 * - Responsive design: Optimized for mobile and desktop
 */

import { useState } from 'react';
import { LayoutDashboard, BarChart3, List } from 'lucide-react';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import {
  FmCommonTabs,
  FmCommonTabsList,
  FmCommonTabsTrigger,
  FmCommonTabsContent,
} from '@/components/common/navigation/FmCommonTabs';
import { formatHeader } from '@/shared';
import { ScreeningQueueView } from './ScreeningQueueView';
import { AnalyticsTab } from './AnalyticsTab';

// ============================================================================
// Types
// ============================================================================

type DashboardTab = 'queues' | 'analytics';

// ============================================================================
// Tab Configuration
// ============================================================================

const MAIN_TABS: { id: DashboardTab; label: string; icon: typeof List }[] = [
  { id: 'queues', label: 'Queues', icon: List },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

// ============================================================================
// Component
// ============================================================================

export function ArtistScreeningDashboard() {
  // Main tab state (Queues vs Analytics)
  const [activeTab, setActiveTab] = useState<DashboardTab>('queues');

  return (
    <div className="space-y-[20px] md:space-y-[40px] max-w-7xl mx-auto px-4 md:px-6">
      {/* Header - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <FmFormSectionHeader
          title={formatHeader('Artist Screening')}
          description="Review and approve artist DJ set submissions"
          icon={LayoutDashboard}
        />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <h1 className="text-2xl font-canela text-white mb-[5px]">
          Artist Screening
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and approve submissions
        </p>
      </div>

      {/* Main Tab Switcher using FmCommonTabs */}
      <FmCommonTabs value={activeTab} onValueChange={(v) => setActiveTab(v as DashboardTab)}>
        <FmCommonTabsList className="border-b border-white/20 pb-[10px] mb-[20px]">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <FmCommonTabsTrigger key={tab.id} value={tab.id} className="gap-[8px]">
                <Icon className="h-4 w-4" />
                {tab.label}
              </FmCommonTabsTrigger>
            );
          })}
        </FmCommonTabsList>

        {/* Queues Tab Content */}
        <FmCommonTabsContent value="queues">
          <ScreeningQueueView />
        </FmCommonTabsContent>

        {/* Analytics Tab Content */}
        <FmCommonTabsContent value="analytics">
          <AnalyticsTab />
        </FmCommonTabsContent>
      </FmCommonTabs>
    </div>
  );
}
