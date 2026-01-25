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
import { LayoutDashboard, BarChart3, List, MapPin, Calendar } from 'lucide-react';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { formatHeader, cn } from '@/shared';
import { ScreeningQueueView } from './ScreeningQueueView';
import { AnalyticsTab } from './AnalyticsTab';
import type { SubmissionContext } from '../types';

// ============================================================================
// Types
// ============================================================================

type DashboardTab = 'queues' | 'analytics';
type QueueTab = 'all' | SubmissionContext;

// ============================================================================
// Tab Configuration
// ============================================================================

const MAIN_TABS: { id: DashboardTab; label: string; icon: typeof List }[] = [
  { id: 'queues', label: 'Queues', icon: List },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const QUEUE_TABS: { id: QueueTab; label: string; icon: typeof List }[] = [
  { id: 'all', label: 'All', icon: List },
  { id: 'general', label: 'General', icon: List },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'venue', label: 'Venues', icon: MapPin },
];

// ============================================================================
// Component
// ============================================================================

export function ArtistScreeningDashboard() {
  // Main tab state (Queues vs Analytics)
  const [activeTab, setActiveTab] = useState<DashboardTab>('queues');

  // Queue context filter
  const [activeQueue, setActiveQueue] = useState<QueueTab>('all');

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

      {/* Main Tab Switcher - Responsive */}
      <FmCommonCard variant="frosted" className="p-[10px] md:p-0 md:bg-transparent md:backdrop-blur-none md:border-0">
        <div className="flex flex-col md:flex-row md:items-center gap-[10px] md:border-b md:border-white/20 md:pb-[10px]">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <FmCommonButton
                key={tab.id}
                variant="default"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'justify-start md:justify-center transition-all w-full md:w-auto',
                  activeTab === tab.id
                    ? 'bg-fm-gold text-black border-fm-gold'
                    : 'hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </FmCommonButton>
            );
          })}
        </div>
      </FmCommonCard>

      {/* Queues Tab Content */}
      {activeTab === 'queues' && (
        <div className="space-y-[15px] md:space-y-[20px]">
          {/* Queue Tab Switcher - Horizontal scroll on mobile */}
          <div className="flex items-center gap-[10px] overflow-x-auto pb-[5px] md:pb-0 scrollbar-hide">
            <span className="text-xs md:text-sm text-muted-foreground uppercase whitespace-nowrap flex-shrink-0">
              Queue:
            </span>
            {QUEUE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <FmCommonButton
                  key={tab.id}
                  variant="default"
                  size="sm"
                  onClick={() => setActiveQueue(tab.id)}
                  className={cn(
                    'flex-shrink-0',
                    activeQueue === tab.id
                      ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                      : ''
                  )}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {tab.label}
                </FmCommonButton>
              );
            })}
          </div>

          {/* Queue View */}
          <ScreeningQueueView context={activeQueue} />
        </div>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}
