/**
 * Artist Screening Dashboard
 *
 * Main dashboard for FM staff to review and approve artist DJ set submissions.
 * Features:
 * - Queues tab: View submissions with filtering and sorting
 * - Analytics tab: View rankings and reviewer leaderboards
 */

import { useState } from 'react';
import { LayoutDashboard, BarChart3, List, MapPin, Calendar } from 'lucide-react';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
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
// Component
// ============================================================================

export function ArtistScreeningDashboard() {
  // Main tab state (Queues vs Analytics)
  const [activeTab, setActiveTab] = useState<DashboardTab>('queues');

  // Queue context filter
  const [activeQueue, setActiveQueue] = useState<QueueTab>('all');

  return (
    <div className="space-y-[40px]">
      {/* Header */}
      <FmFormSectionHeader
        title={formatHeader('Artist Screening')}
        description="Review and approve artist DJ set submissions"
        icon={LayoutDashboard}
      />

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-[10px] border-b border-white/20 pb-[10px]">
        <FmCommonButton
          variant="default"
          onClick={() => setActiveTab('queues')}
          className={cn(
            'transition-all',
            activeTab === 'queues'
              ? 'bg-fm-gold text-black border-fm-gold'
              : 'hover:bg-white/5'
          )}
        >
          <List className="h-4 w-4 mr-2" />
          Queues
        </FmCommonButton>
        <FmCommonButton
          variant="default"
          onClick={() => setActiveTab('analytics')}
          className={cn(
            'transition-all',
            activeTab === 'analytics'
              ? 'bg-fm-gold text-black border-fm-gold'
              : 'hover:bg-white/5'
          )}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </FmCommonButton>
      </div>

      {/* Queues Tab Content */}
      {activeTab === 'queues' && (
        <div className="space-y-[20px]">
          {/* Queue Tab Switcher */}
          <div className="flex items-center gap-[10px]">
            <span className="text-sm text-muted-foreground uppercase">
              Queue:
            </span>
            <FmCommonButton
              variant="default"
              size="sm"
              onClick={() => setActiveQueue('all')}
              className={cn(
                activeQueue === 'all'
                  ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                  : ''
              )}
            >
              All Submissions
            </FmCommonButton>
            <FmCommonButton
              variant="default"
              size="sm"
              onClick={() => setActiveQueue('general')}
              className={cn(
                activeQueue === 'general'
                  ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                  : ''
              )}
            >
              <List className="h-4 w-4 mr-1" />
              General
            </FmCommonButton>
            <FmCommonButton
              variant="default"
              size="sm"
              onClick={() => setActiveQueue('event')}
              className={cn(
                activeQueue === 'event'
                  ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                  : ''
              )}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Events
            </FmCommonButton>
            <FmCommonButton
              variant="default"
              size="sm"
              onClick={() => setActiveQueue('venue')}
              className={cn(
                activeQueue === 'venue'
                  ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                  : ''
              )}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Venues
            </FmCommonButton>
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
